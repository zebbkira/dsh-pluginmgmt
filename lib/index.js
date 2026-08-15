import { createRequire } from "node:module";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execFile, spawn } from "node:child_process";
import { defineTool } from "@deepseek-ai/dsh-tools";
//#region src/protocol.ts
const API = {
	plugins: "/api/dsh-pluginmgmt/plugins",
	inspect: "/api/dsh-pluginmgmt/inspect",
	install: "/api/dsh-pluginmgmt/install",
	remove: "/api/dsh-pluginmgmt/remove",
	update: "/api/dsh-pluginmgmt/update",
	checkUpdates: "/api/dsh-pluginmgmt/check-updates",
	toggle: "/api/dsh-pluginmgmt/toggle",
	status: "/api/dsh-pluginmgmt/status",
	settings: "/api/dsh-pluginmgmt/settings",
	autoUpdate: "/api/dsh-pluginmgmt/auto-update"
};
//#endregion
//#region src/engine/entry.ts
/** Resolve a package dir and read its bundle insert id (for enable/disable). */
function resolvePackageDir(packageName, profileDir) {
	let req;
	try {
		req = createRequire(join(profileDir, "package.json"));
	} catch {
		return null;
	}
	const paths = req.resolve.paths(packageName) ?? [];
	for (const searchPath of paths) if (existsSync(join(searchPath, packageName, "package.json"))) return join(searchPath, packageName);
	return null;
}
/** The first insert id a bundle declares (its own patch entry), if any. */
function getBundleEntryId(packageName, profileDir) {
	const dir = resolvePackageDir(packageName, profileDir);
	if (dir === null) return null;
	let manifest;
	try {
		manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
	} catch {
		return null;
	}
	const patchRel = manifest.dsh?.bundle?.patch;
	if (typeof patchRel !== "string") return null;
	let raw;
	try {
		raw = readFileSync(join(dir, patchRel), "utf8");
	} catch {
		return null;
	}
	const m = /^\s*-\s+id:\s*(.+?)\s*$/m.exec(raw);
	if (m !== null) return m[1].trim();
	return null;
}
//#endregion
//#region src/engine/patch.ts
/** Line-based editor for the profile cordis.patch.yml (preserves comments). */
function readPatch(path) {
	const state = {
		inserts: [],
		disabled: /* @__PURE__ */ new Map()
	};
	if (!existsSync(path)) return state;
	const lines = readFileSync(path, "utf8").split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const idm = /^-\s+id:\s*(.+?)\s*(?:#.*)?$/.exec(line);
		if (idm !== null) {
			const id = idm[1].trim();
			for (let j = i + 1; j < lines.length; j++) {
				if (/^-\s+id:/.test(lines[j]) || /^-\s+insert:/.test(lines[j])) break;
				const d = /^\s*disabled:\s*(true|false)/.exec(lines[j]);
				if (d !== null) {
					state.disabled.set(id, d[1] === "true");
					break;
				}
			}
		} else if (/^-\s+insert:\s*$/.test(line)) {
			let id = "";
			let name = "";
			for (let j = i + 1; j < lines.length; j++) {
				const l = lines[j];
				if (/^-\s+/.test(l) && !/^\s+-\s+id:/.test(l) && !/^\s+name:/.test(l)) break;
				const im = /^\s+-\s+id:\s*(.+?)\s*$/.exec(l);
				if (im !== null) id = im[1].trim();
				const nm = /^\s+name:\s*(.+?)\s*$/.exec(l);
				if (nm !== null) name = nm[1].trim().replace(/^['"]|['"]$/g, "");
			}
			if (id !== "") state.inserts.push({
				id,
				name
			});
		}
	}
	return state;
}
/** Set (or update) the disabled flag on one entry id; append if absent. */
function toggleDisabled(path, id, enabled) {
	const lines = readFileSync(path, "utf8").split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const m = /^-\s+id:\s*(.+?)\s*(?:#.*)?$/.exec(lines[i]);
		if (m === null || m[1].trim() !== id) continue;
		for (let j = i + 1; j < lines.length; j++) {
			const l = lines[j];
			if (/^-\s+id:/.test(l) || /^-\s+insert:/.test(l)) break;
			if (/^\s*disabled:\s*(true|false)/.test(l)) {
				lines[j] = l.replace(/^(\s*disabled:\s*)(true|false)/, "$1" + String(enabled));
				writeFileSync(path, lines.join("\n"));
				return;
			}
		}
		lines.splice(i + 1, 0, "  disabled: " + String(enabled));
		writeFileSync(path, lines.join("\n"));
		return;
	}
	while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
	lines.push("- id: " + id);
	lines.push("  disabled: " + String(enabled));
	lines.push("");
	writeFileSync(path, lines.join("\n"));
}
/** Append an insert block for a pure cordis plugin. */
function addInsert(path, id, name) {
	const lines = readFileSync(path, "utf8").split(/\r?\n/);
	while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
	lines.push("- insert:");
	lines.push("    - id: " + id);
	lines.push("      name: " + JSON.stringify(name));
	lines.push("");
	writeFileSync(path, lines.join("\n"));
}
/** Remove the insert block whose sub-entry id matches. */
function removeInsert(path, id) {
	const lines = readFileSync(path, "utf8").split(/\r?\n/);
	const out = [];
	let i = 0;
	while (i < lines.length) {
		if (/^-\s+insert:\s*$/.test(lines[i])) {
			let j = i + 1;
			let hasId = false;
			while (j < lines.length && !/^-\s+(?:id|insert):/.test(lines[j])) {
				const im = /^\s+-\s+id:\s*(.+?)\s*$/.exec(lines[j]);
				if (im !== null && im[1].trim() === id) hasId = true;
				j++;
			}
			if (hasId) {
				while (j < lines.length && lines[j].trim() === "") j++;
				i = j;
				continue;
			}
		}
		out.push(lines[i]);
		i++;
	}
	writeFileSync(path, out.join("\n"));
}
//#endregion
//#region src/engine/reconcile.ts
/** Bundle-layer reconcile: mirror the official 'dsh plugin' post-pnpm step. */
function exportsPatch(packageName, profileDir) {
	let req;
	try {
		req = createRequire(join(profileDir, "package.json"));
	} catch {
		return false;
	}
	const paths = req.resolve.paths(packageName) ?? [];
	for (const searchPath of paths) {
		const manifestPath = join(searchPath, packageName, "package.json");
		if (!existsSync(manifestPath)) continue;
		try {
			return JSON.parse(readFileSync(manifestPath, "utf8")).dsh?.bundle?.patch !== void 0;
		} catch {
			return false;
		}
	}
	return false;
}
function readProfileManifest(profileDir) {
	return JSON.parse(readFileSync(join(profileDir, "package.json"), "utf8"));
}
function writeProfileManifest(profileDir, manifest) {
	writeFileSync(join(profileDir, "package.json"), JSON.stringify(manifest, void 0, 2) + "\n");
}
function reconcileBundles(before, profileDir) {
	const after = readProfileManifest(profileDir);
	const beforeDeps = new Set(Object.keys(before.dependencies ?? {}));
	const dependencies = Object.keys(after.dependencies ?? {});
	const plugins = [...after.dsh?.profile?.bundles ?? []];
	let changed = false;
	const warnings = [];
	for (const packageName of dependencies) {
		const isBundle = exportsPatch(packageName, profileDir);
		if (isBundle && !plugins.includes(packageName)) {
			plugins.push(packageName);
			changed = true;
		} else if (!isBundle && !beforeDeps.has(packageName)) warnings.push(packageName);
	}
	const dependencySet = new Set(dependencies);
	for (const packageName of [...plugins]) {
		const wasDependency = beforeDeps.has(packageName) || dependencySet.has(packageName);
		const stillBundle = dependencySet.has(packageName) && exportsPatch(packageName, profileDir);
		if (wasDependency && !stillBundle) {
			plugins.splice(plugins.indexOf(packageName), 1);
			changed = true;
		}
	}
	if (changed) {
		after.dsh = {
			...after.dsh,
			profile: {
				...after.dsh?.profile,
				bundles: plugins
			}
		};
		writeProfileManifest(profileDir, after);
	}
	return {
		changed,
		bundles: plugins,
		warnings
	};
}
function dshHome() {
	return process.env.DSH_HOME || join(homedir(), ".dsh");
}
function profileDir() {
	return join(dshHome(), "profiles", "web");
}
function profilePatchPath() {
	return join(profileDir(), "cordis.patch.yml");
}
function registryPath() {
	return join(dshHome(), "dsh-pluginmgmt.json");
}
//#endregion
//#region src/engine/registry.ts
/** dsh-pluginmgmt install registry (~/.dsh/dsh-pluginmgmt.json). */
function atomicWrite(path, content) {
	const tmp = path + ".tmp-" + process.pid;
	writeFileSync(tmp, content, {
		encoding: "utf8",
		mode: 384
	});
	renameSync(tmp, path);
}
function readRegistry() {
	const path = registryPath();
	if (!existsSync(path)) return {
		version: 1,
		plugins: {}
	};
	try {
		const parsed = JSON.parse(readFileSync(path, "utf8"));
		if (parsed === null || typeof parsed !== "object" || parsed.version !== 1 || typeof parsed.plugins !== "object" || parsed.plugins === null) return {
			version: 1,
			plugins: {}
		};
		return parsed;
	} catch {
		return {
			version: 1,
			plugins: {}
		};
	}
}
function writeRegistry(doc) {
	atomicWrite(registryPath(), JSON.stringify(doc, null, 2) + "\n");
}
function setEntry(entry) {
	const doc = readRegistry();
	doc.plugins[entry.name] = entry;
	writeRegistry(doc);
}
function removeEntry(name) {
	const doc = readRegistry();
	if (doc.plugins[name] === void 0) return false;
	delete doc.plugins[name];
	writeRegistry(doc);
	return true;
}
const DEFAULT_SETTINGS = {
	autoUpdate: false,
	autoUpdateIntervalMin: 30
};
/** Read the auto-update settings (with defaults). */
function readSettings() {
	const doc = readRegistry();
	return {
		...DEFAULT_SETTINGS,
		...doc.settings ?? {}
	};
}
/** Persist the auto-update settings. */
function writeSettings(settings) {
	const doc = readRegistry();
	doc.settings = settings;
	writeRegistry(doc);
}
//#endregion
//#region src/engine/list.ts
/** Merge profile manifest + patch + runtime entries into installed-plugin rows. */
function isGitSpec$1(spec) {
	return spec.startsWith("github:") || spec.startsWith("git+") || spec.startsWith("git:") || spec.includes(".git");
}
/** Derive a github.com URL from a git spec (undefined for npm specs). */
function gitSpecUrl(spec, entryOwner, entryRepo) {
	if (entryOwner !== void 0 && entryRepo !== void 0) return "https://github.com/" + entryOwner + "/" + entryRepo;
	if (spec.startsWith("github:")) return "https://github.com/" + spec.slice(7).split("#")[0].replace(/&.*$/, "");
	if (spec.startsWith("git+")) return spec.slice(4).replace(/#.*$/, "").replace(/\.git$/, "");
}
/** The actual installed version (semver for npm, short commit for git). */
function installedVersion$1(name, spec, entry, profileDir) {
	const dir = resolvePackageDir(name, profileDir);
	if (dir !== null) try {
		const m = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
		if (typeof m.version === "string" && m.version !== "") return m.version;
	} catch {}
	if (entry?.ref !== void 0 && entry.ref !== "") return entry.ref.slice(0, 7);
	if (isGitSpec$1(spec)) {
		const hash = spec.indexOf("#");
		if (hash >= 0) return spec.slice(hash + 1).split("&")[0].slice(0, 7);
		return "git";
	}
	return spec;
}
/** Normalize a repository/homepage value to a clickable github.com URL. */
function normalizeGithubUrl(url) {
	let s = url.trim().replace(/^git\+/, "");
	if (s.startsWith("git@github.com:")) s = "https://github.com/" + s.slice(15);
	else if (s.startsWith("git://github.com/")) s = "https://github.com/" + s.slice(17);
	s = s.replace(/\.git$/, "").replace(/#.*$/, "");
	if (s.startsWith("https://github.com/") || s.startsWith("http://github.com/")) return s;
}
/** Derive a GitHub URL from an installed package's repository/homepage field. */
function githubUrlFromPackage(packageName, profileDir) {
	const dir = resolvePackageDir(packageName, profileDir);
	if (dir === null) return void 0;
	let manifest;
	try {
		manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
	} catch {
		return;
	}
	const repo = manifest.repository;
	let url;
	if (typeof repo === "string") url = repo;
	else if (repo !== null && typeof repo === "object" && typeof repo.url === "string") url = repo.url;
	if (url === void 0 && typeof manifest.homepage === "string") url = manifest.homepage;
	if (url === void 0) return void 0;
	return normalizeGithubUrl(url);
}
function listPlugins(profileDir, runtimeEntries) {
	const manifest = readProfileManifest(profileDir);
	const deps = manifest.dependencies ?? {};
	const bundles = new Set(manifest.dsh?.profile?.bundles ?? []);
	const patch = readPatch(join(profileDir, "cordis.patch.yml"));
	const registry = readRegistry();
	const runtimeByModule = new Map(runtimeEntries.map((e) => [e.moduleName, e]));
	const runtimeById = new Map(runtimeEntries.map((e) => [e.entryId, e]));
	const rows = [];
	for (const [name, spec] of Object.entries(deps)) {
		const entry = registry.plugins[name];
		const isBundle = bundles.has(name);
		const insert = patch.inserts.find((i) => i.name === name);
		let type;
		if (isBundle) type = "bundle";
		else if (insert !== void 0) type = "cordis";
		else type = "npm";
		const entryId = isBundle ? getBundleEntryId(name, profileDir) ?? name : insert?.id ?? entry?.entryId;
		const runtime = runtimeByModule.get(name) ?? (entryId !== void 0 ? runtimeById.get(entryId) : void 0);
		let enabled = true;
		if (entryId !== void 0) {
			if (patch.disabled.get(entryId) === true) enabled = false;
		}
		if (runtime !== void 0) enabled = runtime.enabled;
		rows.push({
			name,
			type,
			version: installedVersion$1(name, spec, entry, profileDir),
			sourceUrl: isGitSpec$1(spec) ? gitSpecUrl(spec, entry?.owner, entry?.repo) : githubUrlFromPackage(name, profileDir),
			entryId,
			enabled,
			runtimePhase: runtime?.phase ?? null,
			managedByBrat: entry !== void 0
		});
	}
	return rows;
}
//#endregion
//#region src/engine/pnpm.ts
/** pnpm runner: spawn pnpm in the profile dir, proxy env stripped, streamed. */
const PROXY_VARS$1 = [
	"http_proxy",
	"https_proxy",
	"HTTP_PROXY",
	"HTTPS_PROXY",
	"ALL_PROXY",
	"all_proxy"
];
function runPnpm(args, onOutput) {
	return new Promise((resolve, reject) => {
		const env = { ...process.env };
		for (const key of PROXY_VARS$1) delete env[key];
		const child = spawn("pnpm", args, {
			cwd: profileDir(),
			env,
			shell: process.platform === "win32",
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			]
		});
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (chunk) => {
			const t = chunk.toString();
			stdout += t;
			onOutput?.(t);
		});
		child.stderr.on("data", (chunk) => {
			const t = chunk.toString();
			stderr += t;
			onOutput?.(t);
		});
		child.on("error", reject);
		child.on("close", (code) => resolve({
			exitCode: code ?? 1,
			stdout,
			stderr
		}));
	});
}
//#endregion
//#region src/engine/resolve.ts
function stripGitSuffix(repo) {
	return repo.toLowerCase().endsWith(".git") ? repo.slice(0, -4) : repo;
}
function parseGithubSource(input) {
	let raw = input.trim();
	if (raw === "") return null;
	if (raw.startsWith("git+")) raw = raw.slice(4);
	if (raw.startsWith("git@github.com:")) {
		let rest = raw.slice(15);
		rest = stripGitSuffix(rest);
		const seg = rest.split("/");
		if (seg.length >= 2 && seg[0] !== "" && seg[1] !== "") return {
			host: "github",
			owner: seg[0],
			repo: seg[1]
		};
		return null;
	}
	if (raw.startsWith("github:")) {
		let rest = raw.slice(7);
		let ref;
		let subdir;
		const hash = rest.indexOf("#");
		if (hash >= 0) {
			const afterHash = rest.slice(hash + 1);
			const amp = afterHash.indexOf("&");
			const refPart = amp >= 0 ? afterHash.slice(0, amp) : afterHash;
			const query = amp >= 0 ? afterHash.slice(amp + 1) : "";
			ref = refPart || void 0;
			rest = rest.slice(0, hash);
			const pm = query.split("&").find((kv) => kv.startsWith("path:"));
			if (pm !== void 0) subdir = pm.slice(5).split("/").filter(Boolean).join("/") || void 0;
		}
		const seg = rest.split("/");
		if (seg.length >= 2 && seg[0] !== "" && seg[1] !== "") return {
			host: "github",
			owner: seg[0],
			repo: stripGitSuffix(seg[1]),
			ref,
			subdir
		};
		return null;
	}
	let url;
	try {
		url = new URL(raw.startsWith("http") ? raw : "https://" + raw);
	} catch {
		return null;
	}
	if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
	const parts = url.pathname.split("/").filter(Boolean);
	if (parts.length < 2) return null;
	const owner = parts[0];
	const repo = stripGitSuffix(parts[1]);
	let ref;
	let subdir;
	if ((parts[2] === "tree" || parts[2] === "blob") && parts[3] !== void 0) {
		ref = parts[3];
		subdir = parts.slice(4).join("/") || void 0;
	}
	return {
		host: "github",
		owner,
		repo,
		ref,
		subdir
	};
}
//#endregion
//#region src/engine/verify.ts
/** Verify a GitHub source: resolve the commit via git ls-remote, fetch the
* package.json, and classify it as bundle / pure cordis / not-a-plugin. */
function gitUrl(source) {
	return "https://github.com/" + source.owner + "/" + source.repo + ".git";
}
function git(args) {
	return new Promise((resolve) => {
		execFile("git", args, {
			shell: process.platform === "win32",
			timeout: 3e4
		}, (error, stdout, stderr) => {
			const code = error ? error.code ?? 1 : 0;
			resolve({
				code: typeof code === "number" ? code : 1,
				stdout: String(stdout),
				stderr: String(stderr)
			});
		});
	});
}
/** Resolve the default branch + its commit, and (optionally) a specific ref. */
async function resolveCommit(url, ref) {
	const head = await git([
		"ls-remote",
		"--symref",
		url,
		"HEAD"
	]);
	if (head.code !== 0) return { error: (head.stderr || head.stdout || "git ls-remote 失败").trim() };
	let defaultBranch;
	let commit;
	for (const line of head.stdout.split("\n")) {
		if (line.startsWith("ref: refs/heads/")) defaultBranch = line.split("	")[0].slice(16);
		const fields = line.split("	");
		if (commit === void 0 && /^[0-9a-f]{40}$/.test(fields[0] ?? "")) commit = fields[0];
	}
	if (commit === void 0) return { error: "无法解析 HEAD commit" };
	if (ref !== void 0 && ref !== "" && ref !== "HEAD" && ref !== defaultBranch) {
		const r = await git([
			"ls-remote",
			url,
			ref
		]);
		if (r.code !== 0) return { error: ("无法解析 ref " + ref).trim() };
		const first = r.stdout.split("\n").find((l) => /^[0-9a-f]{40}\s/.test(l));
		if (first !== void 0) commit = first.split(/\s+/)[0];
	}
	return {
		commit,
		defaultBranch
	};
}
function isObject(v) {
	return typeof v === "object" && v !== null;
}
/** Fetch package.json from raw.githubusercontent.com (public repos). */
async function fetchManifest(source, ref) {
	const seg = source.subdir ? source.subdir + "/" : "";
	const url = "https://raw.githubusercontent.com/" + source.owner + "/" + source.repo + "/" + encodeURIComponent(ref) + "/" + seg + "package.json";
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 2e4);
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			redirect: "follow"
		});
		if (!res.ok) return { error: "package.json 拉取失败（HTTP " + res.status + "；私有仓库需 token，v1 仅支持公共仓库）" };
		const text = await res.text();
		const parsed = JSON.parse(text);
		if (!isObject(parsed)) return { error: "package.json 不是 JSON 对象" };
		return { manifest: parsed };
	} catch (e) {
		return { error: "package.json 拉取失败：" + String(e?.message ?? e) };
	} finally {
		clearTimeout(timer);
	}
}
function classify(manifest) {
	const dsh = isObject(manifest.dsh) ? manifest.dsh : {};
	const caps = [];
	if (isObject(dsh.bundle) && typeof dsh.bundle.patch === "string") caps.push("bundle");
	if (Array.isArray(dsh.skills) && dsh.skills.length > 0) caps.push("skills");
	if (isObject(dsh.mcpServers) && Object.keys(dsh.mcpServers).length > 0) caps.push("mcp");
	if (isObject(dsh.client) && typeof dsh.client.platform === "string") caps.push("client");
	const main = typeof manifest.main === "string" && manifest.main !== "";
	const exp = isObject(manifest.exports) && typeof manifest.exports["."] === "string";
	const hasEntry = main || exp;
	if (caps.includes("bundle")) return {
		ok: true,
		type: "bundle",
		capabilities: caps,
		warnings: []
	};
	if (hasEntry) return {
		ok: true,
		type: "cordis",
		capabilities: caps,
		warnings: ["未声明 dsh.bundle，按纯 cordis 插件处理（清单级判断，安装前请确认）"]
	};
	return {
		ok: false,
		reason: "不是 dsh 插件：package.json 既无 dsh.bundle 也无 cordis 入口（main / exports）",
		capabilities: caps,
		warnings: []
	};
}
/** Inspect a source: resolve + fetch + classify. */
async function inspectSource(source) {
	const resolved = await resolveCommit(gitUrl(source), source.ref);
	if (resolved.error !== void 0) return {
		ok: false,
		reason: resolved.error
	};
	const commit = resolved.commit;
	const fetched = await fetchManifest(source, source.ref ?? resolved.defaultBranch ?? "HEAD");
	if (fetched.error !== void 0) return {
		ok: false,
		reason: fetched.error,
		source,
		commit,
		defaultBranch: resolved.defaultBranch
	};
	const manifest = fetched.manifest;
	const c = classify(manifest);
	return {
		ok: c.ok,
		reason: c.reason,
		source,
		commit,
		defaultBranch: resolved.defaultBranch,
		type: c.type,
		packageName: typeof manifest.name === "string" ? manifest.name : void 0,
		capabilities: c.capabilities,
		warnings: c.warnings
	};
}
//#endregion
//#region src/engine/manager.ts
/** Orchestration: install / remove / update / toggle / check-updates.
* Mutations are serialized by an in-process lock (pnpm in one profile dir
* must not run concurrently). */
let queue = Promise.resolve();
function withLock(fn) {
	const run = queue.then(fn, fn);
	queue = run.then(() => void 0, () => void 0);
	return run;
}
function pnpmError(res) {
	const tail = (res.stderr || res.stdout || "").trim().split("\n").slice(-15).join("\n");
	if (/allowBuilds/i.test(tail)) return "pnpm 阻止了构建脚本，请在 profile 的 pnpm-workspace.yaml 的 allowBuilds 白名单加入该依赖后重试。" + tail;
	return "pnpm 失败：" + tail;
}
function buildGitSpec(source, commit) {
	let spec = "github:" + source.owner + "/" + source.repo + "#" + commit;
	if (source.subdir !== void 0 && source.subdir !== "") spec += "&path:/" + source.subdir;
	return spec;
}
function installPlugin(req) {
	return withLock(async () => {
		const source = parseGithubSource(req.url);
		if (source === null) return {
			ok: false,
			error: "无法解析为 GitHub 仓库链接，请粘贴 https://github.com/owner/repo 形式"
		};
		if (req.ref !== void 0 && req.ref !== "") source.ref = req.ref;
		if (req.subdir !== void 0 && req.subdir !== "") source.subdir = req.subdir;
		const inspect = await inspectSource(source);
		if (!inspect.ok) return {
			ok: false,
			error: inspect.reason ?? "校验失败"
		};
		if (inspect.type === "cordis" && req.confirm !== true) return {
			ok: false,
			error: "NEEDS_CONFIRM",
			detail: inspect.warnings?.join("；") ?? "疑似纯 cordis 插件"
		};
		const pkgName = inspect.packageName ?? source.repo;
		const spec = buildGitSpec(source, inspect.commit ?? "HEAD");
		const before = readProfileManifest(profileDir());
		const res = await runPnpm(["add", spec]);
		if (res.exitCode !== 0) return {
			ok: false,
			error: pnpmError(res)
		};
		reconcileBundles(before, profileDir());
		let entryId;
		if (inspect.type === "cordis") {
			entryId = "ui-" + pkgName.replace(/^@/, "").replace(/\//g, "-");
			addInsert(profilePatchPath(), entryId, pkgName);
		}
		setEntry({
			name: pkgName,
			type: inspect.type ?? "cordis",
			sourceUrl: "https://github.com/" + source.owner + "/" + source.repo,
			spec,
			owner: source.owner,
			repo: source.repo,
			ref: inspect.commit ?? "",
			branch: inspect.defaultBranch ?? source.ref,
			subdir: source.subdir,
			entryId,
			installedAt: Date.now(),
			updatedAt: Date.now()
		});
		return {
			ok: true,
			restartRequired: inspect.type === "bundle",
			detail: "已安装 " + pkgName + (inspect.type === "bundle" ? "（bundle，需重启 web 生效）" : "（纯 cordis，HMR 生效）")
		};
	});
}
function removePlugin(name) {
	return withLock(async () => {
		const entry = readRegistry().plugins[name];
		const before = readProfileManifest(profileDir());
		if (before.dependencies?.[name] === void 0) return {
			ok: false,
			error: "未找到已安装插件 " + name
		};
		const wasBundle = (before.dsh?.profile?.bundles ?? []).includes(name);
		const res = await runPnpm(["rm", name]);
		if (res.exitCode !== 0) return {
			ok: false,
			error: pnpmError(res)
		};
		reconcileBundles(before, profileDir());
		if (entry?.type === "cordis" && entry.entryId !== void 0) removeInsert(profilePatchPath(), entry.entryId);
		removeEntry(name);
		return {
			ok: true,
			restartRequired: wasBundle,
			detail: "已删除 " + name
		};
	});
}
function updatePlugin(name) {
	return withLock(async () => {
		const spec = readProfileManifest(profileDir()).dependencies?.[name];
		if (spec === void 0) return {
			ok: false,
			error: "未找到已安装插件 " + name
		};
		const entry = readRegistry().plugins[name];
		if ((spec.startsWith("github:") || spec.startsWith("git+") || spec.startsWith("git:") || spec.includes(".git")) && entry !== void 0) {
			const latest = await resolveCommit(gitUrl({
				host: "github",
				owner: entry.owner,
				repo: entry.repo
			}), entry.branch);
			if (latest.error !== void 0) return {
				ok: false,
				error: latest.error
			};
			if (latest.commit === entry.ref) return {
				ok: false,
				error: "已是最新（" + entry.ref.slice(0, 7) + "）"
			};
			const spec2 = buildGitSpec({
				host: "github",
				owner: entry.owner,
				repo: entry.repo,
				subdir: entry.subdir
			}, latest.commit ?? "");
			const before = readProfileManifest(profileDir());
			const res = await runPnpm(["add", spec2]);
			if (res.exitCode !== 0) return {
				ok: false,
				error: pnpmError(res)
			};
			reconcileBundles(before, profileDir());
			setEntry({
				...entry,
				spec: spec2,
				ref: latest.commit ?? entry.ref,
				updatedAt: Date.now()
			});
			return {
				ok: true,
				restartRequired: entry.type === "bundle",
				detail: "已更新 " + name + "（" + entry.ref.slice(0, 7) + " → " + (latest.commit ?? "").slice(0, 7) + "）"
			};
		}
		const before = readProfileManifest(profileDir());
		const res = await runPnpm([
			"up",
			"--latest",
			name
		]);
		if (res.exitCode !== 0) return {
			ok: false,
			error: pnpmError(res)
		};
		reconcileBundles(before, profileDir());
		if (entry !== void 0) setEntry({
			...entry,
			updatedAt: Date.now()
		});
		return {
			ok: true,
			restartRequired: true,
			detail: "已更新 " + name
		};
	});
}
function togglePlugin(id, enabled) {
	if (id === void 0 || id === "") return {
		ok: false,
		error: "缺少插件入口 id"
	};
	toggleDisabled(profilePatchPath(), id, enabled);
	return {
		ok: true,
		restartRequired: false,
		detail: (enabled ? "已启用 " : "已禁用 ") + id
	};
}
const PROXY_VARS = [
	"http_proxy",
	"https_proxy",
	"HTTP_PROXY",
	"HTTPS_PROXY",
	"ALL_PROXY",
	"all_proxy"
];
function isGitSpec(spec) {
	return spec.startsWith("github:") || spec.startsWith("git+") || spec.startsWith("git:") || spec.includes(".git");
}
function installedVersion(packageName, dir) {
	const pkgDir = resolvePackageDir(packageName, dir);
	if (pkgDir === null) return void 0;
	try {
		const m = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
		return typeof m.version === "string" ? m.version : void 0;
	} catch {
		return;
	}
}
function latestNpmVersion(packageName) {
	return new Promise((resolve) => {
		const env = { ...process.env };
		for (const key of PROXY_VARS) delete env[key];
		execFile("npm", [
			"view",
			packageName,
			"version"
		], {
			timeout: 3e4,
			shell: process.platform === "win32",
			env
		}, (error, stdout) => {
			if (error !== null) {
				resolve(void 0);
				return;
			}
			const v = String(stdout).trim().split("\n").pop()?.trim();
			resolve(v !== void 0 && /^[0-9]/.test(v) ? v : void 0);
		});
	});
}
/** Map plugin name -> latest version (npm) or short commit (git) when a newer one exists. */
function checkUpdates() {
	return withLock(async () => {
		const dir = profileDir();
		const deps = readProfileManifest(dir).dependencies ?? {};
		const registry = readRegistry();
		const result = {};
		const npmNames = [];
		const gitTasks = [];
		for (const [name, spec] of Object.entries(deps)) if (isGitSpec(spec)) gitTasks.push((async () => {
			const entry = registry.plugins[name];
			let owner;
			let repo;
			let branch;
			if (entry !== void 0) {
				owner = entry.owner;
				repo = entry.repo;
				branch = entry.branch;
			} else {
				const src = parseGithubSource(spec);
				if (src !== null) {
					owner = src.owner;
					repo = src.repo;
					branch = src.ref;
				}
			}
			if (owner === void 0 || repo === void 0) return;
			const latest = await resolveCommit(gitUrl({
				host: "github",
				owner,
				repo
			}), branch);
			if (latest.commit !== void 0 && entry !== void 0 && latest.commit !== entry.ref) result[name] = latest.commit.slice(0, 7);
		})());
		else npmNames.push(name);
		await Promise.all(gitTasks);
		await Promise.all(npmNames.map(async (name) => {
			const installed = installedVersion(name, dir);
			const latest = await latestNpmVersion(name);
			if (installed !== void 0 && latest !== void 0 && installed !== latest) result[name] = latest;
		}));
		return result;
	});
}
//#endregion
//#region src/engine/autoupdate.ts
const state = {
	running: false,
	lastCheckAt: 0,
	updated: [],
	failed: [],
	restartPending: false
};
function getAutoUpdateState() {
	return state;
}
/** Run one check-and-update pass; no-op when already running or auto-update off. */
async function runAutoUpdate(force = false) {
	if (state.running) return state;
	if (!force && !readSettings().autoUpdate) return state;
	state.running = true;
	state.lastCheckAt = Date.now();
	state.updated = [];
	state.failed = [];
	try {
		const updates = await checkUpdates();
		const names = Object.keys(updates);
		for (const name of names) {
			const r = await updatePlugin(name);
			if (r.ok) state.updated.push(name);
			else state.failed.push({
				name,
				error: r.error ?? "unknown"
			});
		}
		if (state.updated.length > 0) state.restartPending = true;
	} catch (e) {
		state.failed.push({
			name: "(check)",
			error: String(e?.message ?? e)
		});
	} finally {
		state.running = false;
	}
	return state;
}
//#endregion
//#region src/routes.ts
const MAX_JSON_BODY_BYTES = 1024 * 1024;
function isLoopbackRequest(request) {
	const address = request.socket.remoteAddress;
	if (address !== "127.0.0.1" && address !== "::1" && address !== "::ffff:127.0.0.1") return false;
	const host = request.headers.host;
	if (typeof host !== "string") return false;
	let hostUrl;
	try {
		hostUrl = new URL("http://" + host);
	} catch {
		return false;
	}
	if (hostUrl.hostname !== "127.0.0.1" && hostUrl.hostname !== "localhost" && hostUrl.hostname !== "[::1]") return false;
	if (request.headers["sec-fetch-site"] === "cross-site") return false;
	const origin = request.headers.origin;
	if (origin === void 0) return true;
	try {
		return new URL(origin).host === hostUrl.host;
	} catch {
		return false;
	}
}
function writeJson(res, status, body) {
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"referrer-policy": "no-referrer"
	});
	res.end(JSON.stringify(body));
}
async function readJsonBody(req) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = chunk;
		size += buffer.length;
		if (size > MAX_JSON_BODY_BYTES) return void 0;
		chunks.push(buffer);
	}
	try {
		const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
		return typeof parsed === "object" && parsed !== null ? parsed : void 0;
	} catch {
		return;
	}
}
function makeRoutes(deps) {
	const guard = (req, res, method) => {
		if (!isLoopbackRequest(req)) {
			writeJson(res, 403, {
				ok: false,
				error: "forbidden: loopback-only"
			});
			return false;
		}
		if (req.method !== method) {
			writeJson(res, 405, {
				ok: false,
				error: "method not allowed"
			});
			return false;
		}
		return true;
	};
	const handle = (method, path, fn) => ({
		kind: "exact",
		path,
		handler: async (req, res) => {
			if (!guard(req, res, method)) return;
			let body = {};
			if (method === "POST") {
				const parsed = await readJsonBody(req);
				if (parsed === void 0) {
					writeJson(res, 400, {
						ok: false,
						error: "invalid or oversized JSON body"
					});
					return;
				}
				body = parsed;
			}
			try {
				writeJson(res, 200, await fn(body));
			} catch (e) {
				writeJson(res, 500, {
					ok: false,
					error: String(e?.message ?? e)
				});
			}
		}
	});
	return [
		handle("GET", API.plugins, () => {
			return {
				ok: true,
				items: listPlugins(profileDir(), deps.getRuntimeEntries())
			};
		}),
		handle("POST", API.inspect, (body) => {
			const url = typeof body?.url === "string" ? body.url : "";
			if (url === "") return {
				ok: false,
				error: "url required"
			};
			const source = parseGithubSource(url);
			if (source === null) return {
				ok: false,
				error: "无法解析为 GitHub 仓库链接"
			};
			const ref = typeof body?.ref === "string" && body.ref !== "" ? body.ref : void 0;
			const subdir = typeof body?.subdir === "string" && body.subdir !== "" ? body.subdir : void 0;
			if (ref !== void 0) source.ref = ref;
			if (subdir !== void 0) source.subdir = subdir;
			return inspectSource(source);
		}),
		handle("POST", API.install, (body) => installPlugin({
			url: typeof body?.url === "string" ? body.url : "",
			ref: typeof body?.ref === "string" ? body.ref : void 0,
			subdir: typeof body?.subdir === "string" ? body.subdir : void 0,
			confirm: body?.confirm === true
		})),
		handle("POST", API.remove, (body) => removePlugin(typeof body?.name === "string" ? body.name : "")),
		handle("POST", API.update, (body) => updatePlugin(typeof body?.name === "string" ? body.name : "")),
		handle("POST", API.checkUpdates, async () => ({
			ok: true,
			updates: await checkUpdates()
		})),
		handle("POST", API.toggle, (body) => {
			return togglePlugin(typeof body?.id === "string" ? body.id : "", body?.enabled === true);
		}),
		{
			kind: "exact",
			path: API.settings,
			handler: async (req, res) => {
				if (!isLoopbackRequest(req)) {
					writeJson(res, 403, {
						ok: false,
						error: "forbidden: loopback-only"
					});
					return;
				}
				if (req.method === "GET") {
					writeJson(res, 200, {
						ok: true,
						settings: readSettings()
					});
					return;
				}
				if (req.method === "POST") {
					const body = await readJsonBody(req);
					if (body === void 0) {
						writeJson(res, 400, {
							ok: false,
							error: "invalid or oversized JSON body"
						});
						return;
					}
					const autoUpdate = body.autoUpdate === true;
					const settings = {
						autoUpdate,
						autoUpdateIntervalMin: typeof body.autoUpdateIntervalMin === "number" && body.autoUpdateIntervalMin > 0 ? body.autoUpdateIntervalMin : readSettings().autoUpdateIntervalMin
					};
					writeSettings(settings);
					if (autoUpdate) runAutoUpdate(true);
					writeJson(res, 200, {
						ok: true,
						settings
					});
					return;
				}
				writeJson(res, 405, {
					ok: false,
					error: "method not allowed"
				});
			}
		},
		handle("POST", API.autoUpdate, async () => ({
			ok: true,
			autoUpdate: await runAutoUpdate(true)
		})),
		handle("GET", API.status, () => ({
			ok: true,
			busy: false,
			autoUpdate: getAutoUpdateState()
		}))
	];
}
//#endregion
//#region src/tools.ts
/** Agent-facing tools sharing the same engine as the routes. */
const text = (value) => [{
	type: "text",
	text: value
}];
function jsonTool(name, description, parameters, fn) {
	return defineTool({
		name,
		description,
		parameters,
		output: {
			schema: { type: "string" },
			render: (_args, value) => text(value)
		},
		execute: async (args) => JSON.stringify(await fn(args), null, 2)
	});
}
function makeTools(deps) {
	const list = () => Promise.resolve({ items: listPlugins(profileDir(), deps.getRuntimeEntries()) });
	return [
		jsonTool("plugin_install", "从 GitHub 仓库链接安装一个 dsh 插件（先校验是 bundle 还是纯 cordis，再 pnpm 安装）。参数 url 必填。", {
			url: {
				type: "string",
				required: true,
				description: "GitHub 仓库链接，如 https://github.com/owner/repo"
			},
			ref: {
				type: "string",
				description: "分支/标签/commit（可选，默认默认分支）"
			},
			subdir: {
				type: "string",
				description: "monorepo 子目录（可选）"
			},
			confirm: {
				type: "boolean",
				description: "纯 cordis 插件需二次确认（true）"
			}
		}, (a) => installPlugin({
			url: String(a.url ?? ""),
			ref: a.ref,
			subdir: a.subdir,
			confirm: a.confirm === true
		})),
		jsonTool("plugin_list", "列出当前 web profile 已安装的插件（bundle / 纯 cordis / npm，含运行态）。", {}, () => list()),
		jsonTool("plugin_remove", "卸载一个已安装插件（pnpm rm + 层栈 reconcile + 清理 cordis insert）。参数 name 必填。", { name: {
			type: "string",
			required: true,
			description: "插件包名"
		} }, (a) => removePlugin(String(a.name ?? ""))),
		jsonTool("plugin_update", "更新一个已安装插件到最新版本（git 源对比最新 commit 后重装；npm 源 pnpm up）。参数 name 必填。", { name: {
			type: "string",
			required: true,
			description: "插件包名"
		} }, (a) => updatePlugin(String(a.name ?? ""))),
		jsonTool("plugin_check_updates", "检查 git 源插件是否有可更新的 commit。", {}, () => checkUpdates()),
		jsonTool("plugin_auto_update", "立即检查并自动更新所有可更新的 git 源插件（强制运行，忽略自动更新开关），完成后返回更新清单。", {}, () => runAutoUpdate(true)),
		jsonTool("plugin_set_auto_update", "开启或关闭后台自动更新（持久化到登记簿）。参数 enabled 必填。", { enabled: {
			type: "boolean",
			required: true,
			description: "是否开启后台自动更新"
		} }, async (a) => {
			const settings = {
				...readSettings(),
				autoUpdate: a.enabled === true
			};
			writeSettings(settings);
			if (settings.autoUpdate) runAutoUpdate(true);
			return {
				ok: true,
				settings
			};
		})
	];
}
//#endregion
//#region src/index.ts
const name = "dsh-pluginmgmt";
const inject = [
	"webServer",
	"tools",
	"systemPrompt",
	"loader"
];
const FIBER_PHASE = {
	0: "pending",
	1: "loading",
	2: "active",
	3: "failed",
	4: null,
	5: "unloading"
};
const GUIDANCE = "本机已安装 dsh-pluginmgmt 插件（插件管理器）：设置页「插件管理」。能力：输入 GitHub 仓库链接 → 校验（git ls-remote 确认仓库 + 读 package.json 判定 bundle / 纯 cordis）→ 一键安装 → 全生命周期 更新 / 删除 / 启用停用；支持自动更新（可开关，后台定时检查并更新 git 源插件，完成后左下角浮动窗口提示重启）。限制：bundle 安装/更新/删除需重启 dsh web 生效（层栈 boot 合成）；纯 cordis 走 HMR；v1 仅支持公共 GitHub 仓库；安装第三方代码 = 运行任意代码，需用户确认。用户提到「插件管理 / 安装插件 / GitHub 直装 / 自动更新」时即指本插件，请据此协作。";
/** Read the current Loader entries (same source as the official inventory). */
function runtimeEntries(ctx) {
	const loader = ctx.loader;
	const entries = [];
	for (const entry of loader.entries()) {
		if (entry.options.group) continue;
		entries.push({
			entryId: entry.id,
			moduleName: entry.options.name,
			enabled: !entry.disabled,
			phase: entry.fiber ? FIBER_PHASE[entry.fiber.state] ?? null : null
		});
	}
	return entries;
}
function apply(ctx) {
	const deps = { getRuntimeEntries: () => runtimeEntries(ctx) };
	ctx.effect(() => ctx.systemPrompt.section({
		name: "plugin:dsh-pluginmgmt",
		order: 161,
		text: GUIDANCE
	}), "dsh-pluginmgmt: prompt");
	ctx.effect(() => {
		const disposers = makeRoutes(deps).map((route) => ctx.webServer.register(route));
		return () => {
			for (const dispose of disposers) dispose();
		};
	}, "dsh-pluginmgmt: routes");
	ctx.effect(() => {
		const disposers = makeTools(deps).map((tool) => ctx.tools.register(tool));
		return () => {
			for (const dispose of disposers) dispose();
		};
	}, "dsh-pluginmgmt: tools");
	ctx.effect(() => {
		const intervalMs = Math.max(5, readSettings().autoUpdateIntervalMin) * 60 * 1e3;
		const timer = setInterval(() => {
			runAutoUpdate();
		}, intervalMs);
		return () => {
			clearInterval(timer);
		};
	}, "dsh-pluginmgmt: auto-update");
}
//#endregion
export { apply, inject, name };
