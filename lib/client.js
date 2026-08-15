window.__ModuleLoader__.load({
	id: "dsh-pluginmgmt",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var __css = ".YCtO4a_sectionPage {\n  flex-direction: column;\n  gap: 14px;\n  display: flex;\n}\n\n.YCtO4a_pageHeading {\n  margin: 0;\n  font-size: 16px;\n  font-weight: 600;\n}\n\n.YCtO4a_pageIntro {\n  color: gray;\n  margin: 0;\n  font-size: 12px;\n}\n\n.YCtO4a_banner {\n  color: #b45309;\n  background: #d977061a;\n  border: 1px solid #d97706;\n  border-radius: 8px;\n  padding: 10px 12px;\n  font-size: 12px;\n}\n\n.YCtO4a_installBox {\n  border: 1px solid #80808047;\n  border-radius: 8px;\n  flex-direction: column;\n  gap: 8px;\n  padding: 12px;\n  display: flex;\n}\n\n.YCtO4a_fieldLabel {\n  font-size: 12px;\n  font-weight: 600;\n}\n\n.YCtO4a_row {\n  align-items: center;\n  gap: 8px;\n  display: flex;\n}\n\n.YCtO4a_input {\n  color: inherit;\n  background: none;\n  border: 1px solid #80808047;\n  border-radius: 6px;\n  flex: 1;\n  padding: 6px 10px;\n  font-size: 13px;\n}\n\n.YCtO4a_btn {\n  color: inherit;\n  cursor: pointer;\n  background: none;\n  border: 1px solid #80808047;\n  border-radius: 6px;\n  padding: 6px 12px;\n  font-size: 12px;\n}\n\n.YCtO4a_btn:disabled {\n  opacity: .45;\n  cursor: default;\n}\n\n.YCtO4a_primary {\n  color: #fff;\n  cursor: pointer;\n  background: #4c9aff;\n  border: none;\n  border-radius: 6px;\n  padding: 7px 16px;\n  font-size: 13px;\n  font-weight: 600;\n}\n\n.YCtO4a_primary:disabled {\n  opacity: .5;\n  cursor: default;\n}\n\n.YCtO4a_dangerBtn {\n  color: #e5534b;\n  cursor: pointer;\n  background: none;\n  border: 1px solid #e5534b66;\n  border-radius: 6px;\n  padding: 6px 12px;\n  font-size: 12px;\n}\n\n.YCtO4a_dangerBtn:disabled {\n  opacity: .45;\n  cursor: default;\n}\n\n.YCtO4a_inspect {\n  border-radius: 8px;\n  margin-top: 4px;\n  padding: 10px;\n  font-size: 12px;\n}\n\n.YCtO4a_inspect[data-ok=\"true\"] {\n  background: #2da44e14;\n  border: 1px solid #2da44e55;\n}\n\n.YCtO4a_inspect[data-ok=\"false\"] {\n  background: #e5534b14;\n  border: 1px solid #e5534b55;\n}\n\n.YCtO4a_inspectBody {\n  flex-direction: column;\n  gap: 6px;\n  display: flex;\n}\n\n.YCtO4a_inspectLine {\n  font-size: 12px;\n}\n\n.YCtO4a_warn {\n  color: #b45309;\n  font-size: 12px;\n}\n\n.YCtO4a_danger {\n  color: #e5534b;\n  font-size: 12px;\n  font-weight: 600;\n}\n\n.YCtO4a_notice {\n  border-radius: 8px;\n  padding: 8px 12px;\n  font-size: 12px;\n}\n\n.YCtO4a_notice[data-kind=\"ok\"] {\n  color: #2da44e;\n  background: #2da44e14;\n  border: 1px solid #2da44e55;\n}\n\n.YCtO4a_notice[data-kind=\"err\"] {\n  color: #e5534b;\n  background: #e5534b14;\n  border: 1px solid #e5534b55;\n}\n\n.YCtO4a_listHead {\n  align-items: center;\n  gap: 8px;\n  display: flex;\n}\n\n.YCtO4a_listHead h3 {\n  margin: 0;\n  font-size: 14px;\n  font-weight: 600;\n}\n\n.YCtO4a_listHead span, .YCtO4a_status {\n  color: gray;\n  font-size: 12px;\n}\n\n.YCtO4a_cards {\n  flex-direction: column;\n  gap: 8px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  display: flex;\n}\n\n.YCtO4a_card {\n  border: 1px solid #80808047;\n  border-radius: 8px;\n  justify-content: space-between;\n  align-items: center;\n  gap: 12px;\n  padding: 10px 12px;\n  display: flex;\n}\n\n.YCtO4a_cardMain {\n  flex-direction: column;\n  gap: 3px;\n  min-width: 0;\n  display: flex;\n}\n\n.YCtO4a_cardTop {\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 6px;\n  display: flex;\n}\n\n.YCtO4a_cardTitle {\n  word-break: break-all;\n  font-size: 13px;\n  font-weight: 600;\n}\n\n.YCtO4a_cardMeta {\n  color: gray;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-size: 11px;\n  overflow: hidden;\n}\n\n.YCtO4a_cardActions {\n  flex-shrink: 0;\n  gap: 6px;\n  display: flex;\n}\n\n.YCtO4a_tag {\n  color: gray;\n  border: 1px solid #80808047;\n  border-radius: 10px;\n  padding: 1px 6px;\n  font-size: 11px;\n}\n\n.YCtO4a_tag[data-type=\"bundle\"] {\n  color: #4c9aff;\n  border-color: #4c9aff55;\n}\n\n.YCtO4a_tag[data-type=\"cordis\"] {\n  color: #2da44e;\n  border-color: #2da44e55;\n}\n\n.YCtO4a_tag[data-off=\"true\"], .YCtO4a_tag[data-phase=\"failed\"] {\n  color: #e5534b;\n  border-color: #e5534b55;\n}\n\n.YCtO4a_tag[data-managed=\"true\"] {\n  color: #b45309;\n  border-color: #b4530955;\n}\n\n.YCtO4a_tag[data-update=\"true\"] {\n  color: #b45309;\n  border-color: #b4530955;\n  font-weight: 600;\n}\n\n.YCtO4a_settingsBox {\n  border: 1px solid #80808047;\n  border-radius: 8px;\n  flex-direction: column;\n  gap: 8px;\n  padding: 10px 12px;\n  display: flex;\n}\n\n.YCtO4a_toggle {\n  cursor: pointer;\n  align-items: center;\n  gap: 8px;\n  font-size: 12px;\n  display: flex;\n}\n\n.YCtO4a_toggle input {\n  cursor: pointer;\n}\n\n.YCtO4a_link {\n  color: #4c9aff;\n  word-break: break-all;\n  text-decoration: none;\n}\n\n.YCtO4a_link:hover {\n  text-decoration: underline;\n}\n";
		var __cssTagId = "dsh-pluginmgmt/style.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(__cssTagId) + "]") === null) {
		  var __cssTag = document.createElement("style");
		  __cssTag.dataset.plugin = "dsh-pluginmgmt";
		  __cssTag.dataset.pluginCss = __cssTagId;
		  __cssTag.textContent = __css;
		  document.head.appendChild(__cssTag);
		}
		
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
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
		//#region src/client/locales.ts
		const zh = {
			title: "插件管理",
			description: "输入 GitHub 仓库链接安装、更新、删除、启停 dsh 插件。"
		};
		const en = {
			title: "Plugin Manager",
			description: "Install, update, remove and toggle dsh plugins from a GitHub URL."
		};
		//#endregion
		//#region src/client/api.ts
		/** Browser-side API client for /api/dsh-pluginmgmt. */
		async function post(path, payload) {
			return (await fetch(path, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload)
			})).json();
		}
		async function get(path) {
			return (await fetch(path)).json();
		}
		var BratApi = class {
			list() {
				return get(API.plugins);
			}
			inspect(url, ref, subdir) {
				return post(API.inspect, {
					url,
					ref,
					subdir
				});
			}
			install(url, ref, subdir, confirm) {
				return post(API.install, {
					url,
					ref,
					subdir,
					confirm
				});
			}
			remove(name) {
				return post(API.remove, { name });
			}
			update(name) {
				return post(API.update, { name });
			}
			checkUpdates() {
				return post(API.checkUpdates, {});
			}
			toggle(id, enabled) {
				return post(API.toggle, {
					id,
					enabled
				});
			}
			getSettings() {
				return get(API.settings);
			}
			setSettings(settings) {
				return post(API.settings, settings);
			}
			triggerAutoUpdate() {
				return post(API.autoUpdate, {});
			}
			status() {
				return get(API.status);
			}
		};
		//#endregion
		//#region src/client/brat-section.module.css
		var brat_section_module_default = {
			"banner": "YCtO4a_banner",
			"btn": "YCtO4a_btn",
			"card": "YCtO4a_card",
			"cardActions": "YCtO4a_cardActions",
			"cardMain": "YCtO4a_cardMain",
			"cardMeta": "YCtO4a_cardMeta",
			"cards": "YCtO4a_cards",
			"cardTitle": "YCtO4a_cardTitle",
			"cardTop": "YCtO4a_cardTop",
			"danger": "YCtO4a_danger",
			"dangerBtn": "YCtO4a_dangerBtn",
			"fieldLabel": "YCtO4a_fieldLabel",
			"input": "YCtO4a_input",
			"inspect": "YCtO4a_inspect",
			"inspectBody": "YCtO4a_inspectBody",
			"inspectLine": "YCtO4a_inspectLine",
			"installBox": "YCtO4a_installBox",
			"link": "YCtO4a_link",
			"listHead": "YCtO4a_listHead",
			"notice": "YCtO4a_notice",
			"pageHeading": "YCtO4a_pageHeading",
			"pageIntro": "YCtO4a_pageIntro",
			"primary": "YCtO4a_primary",
			"row": "YCtO4a_row",
			"sectionPage": "YCtO4a_sectionPage",
			"settingsBox": "YCtO4a_settingsBox",
			"status": "YCtO4a_status",
			"tag": "YCtO4a_tag",
			"toggle": "YCtO4a_toggle",
			"warn": "YCtO4a_warn"
		};
		//#endregion
		//#region src/client/BratSection.tsx
		/** The dsh-pluginmgmt settings page: URL input + verify + install, the installed
		* list with update / remove / toggle actions, and auto-update controls. */
		const api = new BratApi();
		const TYPE_LABEL = {
			bundle: "bundle",
			cordis: "纯 cordis",
			npm: "npm"
		};
		const PHASE_LABEL = {
			pending: "挂起",
			loading: "加载中",
			active: "运行中",
			failed: "失败",
			unloading: "卸载中"
		};
		function BratSection({ t }) {
			const [url, setUrl] = (0, react.useState)("");
			const [inspect, setInspect] = (0, react.useState)(null);
			const [inspecting, setInspecting] = (0, react.useState)(false);
			const [plugins, setPlugins] = (0, react.useState)([]);
			const [loadingList, setLoadingList] = (0, react.useState)(true);
			const [busy, setBusy] = (0, react.useState)("");
			const [notice, setNotice] = (0, react.useState)(null);
			const [restartBanner, setRestartBanner] = (0, react.useState)(false);
			const [needConfirm, setNeedConfirm] = (0, react.useState)(false);
			const [autoUpdate, setAutoUpdate] = (0, react.useState)(false);
			const [updates, setUpdates] = (0, react.useState)({});
			const [checking, setChecking] = (0, react.useState)(false);
			const reload = (0, react.useCallback)(async () => {
				try {
					const res = await api.list();
					if (res.ok) setPlugins(res.items);
				} catch (e) {
					setNotice({
						kind: "err",
						text: String(e?.message ?? e)
					});
				} finally {
					setLoadingList(false);
				}
			}, []);
			const doCheckUpdates = (0, react.useCallback)(async () => {
				setChecking(true);
				try {
					const r = await api.checkUpdates();
					if (r.ok) setUpdates(r.updates);
				} catch (e) {
					setNotice({
						kind: "err",
						text: String(e?.message ?? e)
					});
				} finally {
					setChecking(false);
				}
			}, []);
			(0, react.useEffect)(() => {
				reload();
			}, [reload]);
			(0, react.useEffect)(() => {
				(async () => {
					try {
						const s = await api.getSettings();
						if (s.ok) setAutoUpdate(s.settings.autoUpdate);
					} catch {}
				})();
			}, []);
			const toggleAuto = async (on) => {
				setAutoUpdate(on);
				try {
					const r = await api.setSettings({ autoUpdate: on });
					if (r.ok) setAutoUpdate(r.settings.autoUpdate);
				} catch (e) {
					setNotice({
						kind: "err",
						text: String(e?.message ?? e)
					});
				}
			};
			const doUpdateAll = async () => {
				const names = Object.keys(updates);
				if (names.length === 0) {
					setNotice({
						kind: "ok",
						text: "暂无更新"
					});
					return;
				}
				setBusy("updateAll");
				setNotice(null);
				let okCount = 0;
				try {
					for (const name of names) {
						const r = await api.update(name);
						if (r.ok) {
							okCount++;
							if (r.restartRequired) setRestartBanner(true);
						}
					}
					setNotice({
						kind: "ok",
						text: "已更新 " + okCount + " 个插件"
					});
					await reload();
					await doCheckUpdates();
				} catch (e) {
					setNotice({
						kind: "err",
						text: String(e?.message ?? e)
					});
				} finally {
					setBusy("");
				}
			};
			const doInspect = async () => {
				setInspecting(true);
				setInspect(null);
				setNotice(null);
				setNeedConfirm(false);
				try {
					setInspect(await api.inspect(url));
				} catch (e) {
					setNotice({
						kind: "err",
						text: String(e?.message ?? e)
					});
				} finally {
					setInspecting(false);
				}
			};
			const doInstall = async (confirm) => {
				setBusy("install");
				setNotice(null);
				try {
					const r = await api.install(url, inspect?.source?.ref, inspect?.source?.subdir, confirm);
					if (r.ok) {
						setNotice({
							kind: "ok",
							text: r.detail ?? "已安装"
						});
						if (r.restartRequired) setRestartBanner(true);
						setInspect(null);
						setUrl("");
						setNeedConfirm(false);
						await reload();
					} else if (r.error === "NEEDS_CONFIRM") {
						setNeedConfirm(true);
						setNotice({
							kind: "err",
							text: "疑似纯 cordis 插件，请确认后再次安装"
						});
					} else setNotice({
						kind: "err",
						text: r.error ?? "安装失败"
					});
				} catch (e) {
					setNotice({
						kind: "err",
						text: String(e?.message ?? e)
					});
				} finally {
					setBusy("");
				}
			};
			const doRemove = async (name) => {
				setBusy("remove:" + name);
				setNotice(null);
				try {
					const r = await api.remove(name);
					if (r.ok) {
						setNotice({
							kind: "ok",
							text: r.detail ?? "已删除"
						});
						if (r.restartRequired) setRestartBanner(true);
						await reload();
					} else setNotice({
						kind: "err",
						text: r.error ?? "删除失败"
					});
				} catch (e) {
					setNotice({
						kind: "err",
						text: String(e?.message ?? e)
					});
				} finally {
					setBusy("");
				}
			};
			const doUpdate = async (name) => {
				setBusy("update:" + name);
				setNotice(null);
				try {
					const r = await api.update(name);
					if (r.ok) {
						setNotice({
							kind: "ok",
							text: r.detail ?? "已更新"
						});
						if (r.restartRequired) setRestartBanner(true);
						await reload();
						await doCheckUpdates();
					} else setNotice({
						kind: "err",
						text: r.error ?? "更新失败"
					});
				} catch (e) {
					setNotice({
						kind: "err",
						text: String(e?.message ?? e)
					});
				} finally {
					setBusy("");
				}
			};
			const doToggle = async (row) => {
				if (row.entryId === void 0) {
					setNotice({
						kind: "err",
						text: "该插件无入口 id，无法启停"
					});
					return;
				}
				setBusy("toggle:" + row.name);
				setNotice(null);
				try {
					const r = await api.toggle(row.entryId, !row.enabled);
					if (r.ok) {
						setNotice({
							kind: "ok",
							text: r.detail ?? "已切换"
						});
						await reload();
					} else setNotice({
						kind: "err",
						text: r.error ?? "切换失败"
					});
				} catch (e) {
					setNotice({
						kind: "err",
						text: String(e?.message ?? e)
					});
				} finally {
					setBusy("");
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: brat_section_module_default.sectionPage,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: brat_section_module_default.pageHeading,
						children: t("title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: brat_section_module_default.pageIntro,
						children: t("description")
					}),
					restartBanner ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: brat_section_module_default.banner,
						role: "status",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "需要重启 dsh web 生效。" }), " 部分改动（bundle 增删/更新）在下次启动时合成层栈。"]
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: brat_section_module_default.settingsBox,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: brat_section_module_default.toggle,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: autoUpdate,
								onChange: (e) => void toggleAuto(e.currentTarget.checked)
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "自动更新（后台定时检查并更新 git 源插件，完成后左下角提示重启）" })]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: brat_section_module_default.row,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: brat_section_module_default.btn,
								type: "button",
								disabled: checking || busy !== "",
								onClick: () => void doCheckUpdates(),
								children: checking ? "检查中…" : "检查更新"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								className: brat_section_module_default.btn,
								type: "button",
								disabled: busy !== "" || Object.keys(updates).length === 0,
								onClick: () => void doUpdateAll(),
								children: [
									"更新全部（",
									Object.keys(updates).length,
									"）"
								]
							})]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: brat_section_module_default.installBox,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								className: brat_section_module_default.fieldLabel,
								children: "GitHub 仓库链接"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: brat_section_module_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: brat_section_module_default.input,
									type: "text",
									value: url,
									placeholder: "https://github.com/owner/repo",
									onChange: (e) => setUrl(e.currentTarget.value),
									onKeyDown: (e) => {
										if (e.key === "Enter") doInspect();
									}
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: brat_section_module_default.btn,
									type: "button",
									disabled: inspecting || url.trim() === "",
									onClick: () => void doInspect(),
									children: inspecting ? "校验中…" : "校验"
								})]
							}),
							inspect !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: brat_section_module_default.inspect,
								"data-ok": inspect.ok ? "true" : "false",
								children: inspect.ok ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: brat_section_module_default.inspectBody,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: brat_section_module_default.inspectLine,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: inspect.packageName ?? "?" }),
												" · ",
												TYPE_LABEL[inspect.type ?? "npm"] ?? inspect.type
											]
										}),
										inspect.capabilities && inspect.capabilities.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: brat_section_module_default.inspectLine,
											children: ["能力：", inspect.capabilities.join("、")]
										}) : null,
										inspect.defaultBranch ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: brat_section_module_default.inspectLine,
											children: ["分支：", inspect.defaultBranch]
										}) : null,
										inspect.commit ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: brat_section_module_default.inspectLine,
											children: ["commit：", inspect.commit.slice(0, 12)]
										}) : null,
										inspect.warnings && inspect.warnings.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: brat_section_module_default.warn,
											children: ["⚠ ", inspect.warnings.join("；")]
										}) : null,
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: brat_section_module_default.danger,
											children: "安装第三方代码即运行任意代码，请确认来源可信。"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: brat_section_module_default.row,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												className: brat_section_module_default.primary,
												type: "button",
												disabled: busy !== "",
												onClick: () => void doInstall(needConfirm),
												children: busy === "install" ? "安装中…" : needConfirm ? "确认安装（纯 cordis）" : "安装"
											})
										})
									]
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: brat_section_module_default.warn,
									children: ["✗ ", inspect.reason ?? "校验失败"]
								})
							}) : null
						]
					}),
					notice !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: brat_section_module_default.notice,
						"data-kind": notice.kind,
						role: notice.kind === "err" ? "alert" : "status",
						children: notice.text
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: brat_section_module_default.listHead,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: "已安装插件" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: plugins.length })]
					}),
					loadingList ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: brat_section_module_default.status,
						children: "加载中…"
					}) : null,
					!loadingList && plugins.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: brat_section_module_default.status,
						children: "暂无已安装插件"
					}) : null,
					plugins.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: brat_section_module_default.cards,
						children: plugins.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: brat_section_module_default.card,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: brat_section_module_default.cardMain,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: brat_section_module_default.cardTop,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
											className: brat_section_module_default.cardTitle,
											children: row.name
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: brat_section_module_default.tag,
											"data-type": row.type,
											children: TYPE_LABEL[row.type] ?? row.type
										}),
										row.enabled ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: brat_section_module_default.tag,
											"data-off": "true",
											children: "已禁用"
										}),
										row.runtimePhase !== null && row.runtimePhase !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: brat_section_module_default.tag,
											"data-phase": row.runtimePhase,
											children: PHASE_LABEL[row.runtimePhase] ?? row.runtimePhase
										}) : null,
										row.managedByBrat ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: brat_section_module_default.tag,
											"data-managed": "true",
											children: "mgmt"
										}) : null,
										updates[row.name] ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: brat_section_module_default.tag,
											"data-update": "true",
											children: ["可更新 → ", updates[row.name]]
										}) : null
									]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: brat_section_module_default.cardMeta,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["版本 ", row.version] }), row.sourceUrl !== void 0 && row.sourceUrl !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: " · " }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
										className: brat_section_module_default.link,
										href: row.sourceUrl,
										target: "_blank",
										rel: "noopener noreferrer",
										title: row.sourceUrl,
										children: "GitHub ↗"
									})] }) : null]
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: brat_section_module_default.cardActions,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: brat_section_module_default.btn,
										type: "button",
										disabled: busy !== "",
										onClick: () => void doUpdate(row.name),
										children: "更新"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: brat_section_module_default.btn,
										type: "button",
										disabled: busy !== "" || row.entryId === void 0,
										onClick: () => void doToggle(row),
										children: row.enabled ? "禁用" : "启用"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: brat_section_module_default.dangerBtn,
										type: "button",
										disabled: busy !== "",
										onClick: () => void doRemove(row.name),
										children: "删除"
									})
								]
							})]
						}, row.name))
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/index.ts
		const NS = "dsh-pluginmgmt";
		const inject = [
			"slots",
			"workspaces",
			"locale"
		];
		/** Render the floating restart prompt (plain DOM, no React). */
		function mountToast(ctx) {
			const el = document.createElement("div");
			el.setAttribute("data-dsh-pluginmgmt-toast", "");
			el.style.cssText = "position:fixed;left:16px;bottom:16px;z-index:9999;display:none;max-width:340px;padding:12px 14px;border-radius:12px;border:1px solid #d97706;background:#2c2c2e;color:#eee;box-shadow:0 8px 24px rgba(0,0,0,.35);font-family:system-ui;font-size:12px;line-height:1.5;";
			document.body.appendChild(el);
			let shown = false;
			const show = (updated, failed) => {
				el.textContent = "";
				const strong = document.createElement("strong");
				strong.textContent = "dsh-pluginmgmt 已自动更新 " + updated.length + " 个插件";
				el.appendChild(strong);
				if (updated.length > 0) {
					const names = document.createElement("div");
					names.style.cssText = "margin-top:4px;opacity:.85;word-break:break-all;";
					names.textContent = updated.join("、");
					el.appendChild(names);
				}
				if (failed.length > 0) {
					const f = document.createElement("div");
					f.style.cssText = "margin-top:4px;opacity:.7;color:#f0a;";
					f.textContent = "失败：" + failed.map((x) => x.name).join("、");
					el.appendChild(f);
				}
				const hint = document.createElement("div");
				hint.style.cssText = "margin-top:6px;opacity:.85;";
				hint.textContent = "改动已写入，请适时重启 dsh web 生效。";
				el.appendChild(hint);
				const btn = document.createElement("button");
				btn.textContent = "知道了";
				btn.style.cssText = "margin-top:8px;padding:4px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;font-size:11px;";
				btn.addEventListener("click", () => {
					el.style.display = "none";
				});
				el.appendChild(btn);
				el.style.display = "block";
			};
			const poll = async () => {
				try {
					const st = (await fetch(API.status).then((r) => r.json()))?.autoUpdate;
					if (st && st.restartPending && !shown) {
						shown = true;
						show(st.updated ?? [], st.failed ?? []);
					}
				} catch {}
			};
			poll();
			const timer = setInterval(poll, 15e3);
			return () => {
				clearInterval(timer);
				el.remove();
			};
		}
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-pluginmgmt: dictionaries");
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "dsh-pluginmgmt",
				order: 30,
				label: () => ctx.locale.bind(NS)("title"),
				locale: NS,
				inject: () => ({})
			}, BratSection));
			ctx.effect(() => mountToast(ctx), "dsh-pluginmgmt: auto-update-toast");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		
		return module.exports;
	}
});
