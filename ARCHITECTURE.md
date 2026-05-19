# 嘉虹医生端前端架构

## 目标

当前项目保持原生 HTML/CSS/JavaScript，不引入框架；架构上按生产前端的边界拆分，所有页面由 Mock API 数据驱动，避免业务数据散落在渲染代码里。

## 模块分层

- `script.js`：应用启动入口，负责初始化数据、渲染页面、绑定交互。
- `src/core.js`：路由识别、查询参数读取、页面跳转 URL、静态资源 URL。
- `src/api/httpClient.js`：统一 JSON 请求封装，未来替换真实接口时优先改这里。
- `src/api/mockApi.js`：Mock API 门面，模拟真实接口延迟和返回结构。
- `src/api/appApi.js`：应用 API facade，页面和 controllers 只依赖这里；未来替换真实接口优先改这里的导出。
- `src/controllers/chatController.js`：聊天消息控制器，封装进行中聊天消息追加、查询和撤回。
- `src/controllers/consultationController.js`：问诊流程控制器，封装状态机事件、问诊结束/取消、处方状态同步和待接诊同步。
- `src/controllers/contentController.js`：公告和快捷入口读取控制器，避免交互层直接读取数据仓库。
- `src/controllers/prescriptionController.js`：处方编辑控制器，封装诊断/药品候选、增删改和去重规则。
- `src/controllers/realtimeController.js`：实时状态控制器，封装 Mock 快照、会话新增、状态机注册和队列同步。
- `src/controllers/runtimeController.js`：运行态控制器，封装医生状态和服务开关的本地状态与 API 同步。
- `src/mocks/app-bootstrap.json`：页面启动所需 Mock 数据源。
- `src/data.js`：内存数据仓库，只保存 API hydrate 后的数据，不写业务样例。
- `src/state.js`：运行态状态，例如服务开关、消息徽标、问诊状态机实例。
- `src/renderContext.js`：渲染上下文适配层，集中把全局数据仓库和运行态暴露给渲染层。
- `src/domain/consultationStateMachine.js`：问诊领域状态机，集中约束流程流转。
- `src/domain/consultationQueue.js`：会话列表和待接诊队列的统一计算口径。
- `src/domain/prescriptionCatalog.js`：处方编辑候选诊断、药品和拼音排序规则。
- `src/ui/icons.js`：应用图标 HTML 模板，供渲染层和少量交互更新复用。
- `src/ui/dom.js`：DOM 查询、局部替换和应用挂载等浏览器适配操作。
- `src/render.js`：HTML 渲染函数，输入来自渲染上下文，不直接发请求或操作 DOM。
- `src/interactions.js`：事件绑定和 DOM 响应，只把用户动作转交给 controllers/render/ui 模块。

## 依赖方向

模块依赖必须保持单向，避免环形和横向偷取状态：

```text
script.js
  -> store / render / interactions / ui

interactions
  -> controllers / render / ui / core

controllers
  -> api/appApi / data / state / domain / core

render
  -> renderContext / domain / ui / core

renderContext
  -> data / state

state
  -> domain

api
  -> httpClient / mocks

domain
  -> no app dependencies
```

约束：

- `interactions.js` 不直接 import `data.js`、`api/mockApi.js` 或业务状态机；需要业务动作时新增/复用 controller。
- `render.js` 不直接操作 DOM，不直接请求 API，不直接修改 `data.js` 或 `state.js`。
- `domain/*` 必须保持纯业务规则，不依赖 DOM、API、data、state 或 render。
- 页面要替换 Mock API 时优先改 `src/api/appApi.js` 的导出，不穿透改 controllers。
- 新增业务流程优先放到 `controllers/*`，再由交互层绑定 DOM 事件调用。

## 实时 Mock 状态

候诊人数和接诊状态不允许在页面里写死。当前通过 `mockApi.js` 模拟后端运行态：

- `getRealtimeSnapshot()` 每 3 秒生成新的候诊队列数据。
- 进行中问诊启动时预置 2 条，实时 Mock 池继续随机补充到 6 条上限；最终保持图文 3 条、视频 3 条。
- 每条 Mock 会话包含独立患者资料、完整手机号和身份证号、匹配症状的聊天回复、诊断标签和处方用药，避免页面出现重复病人。
- `getRealtimeSnapshot()` 从 `realtimePool` 随机抽取未出现的病例，并把候诊人数从 2 逐步同步到 6。
- `waitingQueue` 写入 Mock 运行态存储，页面跳转后继续保持同一份候诊数字。
- `updateDoctorStatus(status)` 写入 Mock 运行态存储，首页和问诊页读取同一个接诊状态。
- `updateServiceAvailability(serviceKey, enabled)` 写入 Mock 运行态存储，首页服务开关和问诊页顶部服务开关保持一致。

页面只通过 `state.js` 的 `doctorStatusState`、`waitingQueueState`、`serviceState` 读取运行态，不直接读取或修改 DOM 中的数字作为业务状态。`waitingQueueState` 必须由 `consultationQueue.js` 基于当前会话列表推导，确保首页和问诊室待接诊数字与进行中消息条数一致。

消息列表和问诊详情同样由 Mock API 驱动：

- 新增会话通过 `newConsultation.record` 进入 `data.js` 的 `consultationRecords`。
- 新增聊天通过 `newConsultation.chat` 进入 `ongoingChatState`。
- 点击会话时路由携带 `record` 参数，图文/视频页按同一个 `recordId` 渲染药店、患者、聊天、诊断和用药信息。
- 进行中的消息列表最多展示 6 条，Mock 运行态新增会话会随机插入列表位置并做数量裁剪，避免列表无限增长或类型固定分组。
- 未读状态按 `record.id` 持久化，不再按列表位置计算，新增会话插入后不会导致徽标错位。

## 数据结构

`src/mocks/app-bootstrap.json` 是启动聚合数据：

```json
{
  "schemaVersion": 1,
  "navigation": { "menuGroups": [] },
  "home": {
    "quickActions": [],
    "quickEntryOptions": [],
    "announcements": []
  },
  "services": [],
  "consultations": {
    "records": [],
    "ongoingChats": {}
  },
  "quickReplies": {
    "categories": [],
    "messages": []
  }
}
```

未来接真实后端时，可以把这个聚合接口拆成多个接口：

- `GET /api/navigation`
- `GET /api/home`
- `GET /api/services`
- `GET /api/consultations`
- `GET /api/quick-replies`

页面代码不应直接关心接口数量，只通过 `appApi.js` 暴露的 API facade 调用。

## API 通信层

当前所有页面和 controllers 请求从 `appApi.js` 进入，`appApi.js` 暂时转发到 `mockApi.js`：

- `getAppBootstrap()`：加载启动 Mock 数据。
- `updateServiceAvailability(serviceKey, enabled)`：模拟服务开关保存。
- `updateConsultationStatus(recordId, event)`：模拟问诊流程状态同步。

真实接口上线时，保留 `appApi.js` 的函数签名，替换内部导出或实现即可。

## 问诊状态机

问诊状态集中定义在 `consultationStateMachine.js`：

```text
waiting -> ongoing -> risk_review -> prescription_submitted -> ended -> archived
          |           |
          |           -> cancelled
          -> cancelled
```

事件：

- `ACCEPT`：接诊。
- `OPEN_RISK_REVIEW`：提交处方前进入风险检测。
- `SUBMIT_PRESCRIPTION`：风险确认后提交处方。
- `END`：结束问诊。
- `CANCEL`：取消问诊。
- `ARCHIVE`：归档封存。

交互层只能发送事件，不应在页面里手写随意状态变更。

## 开发约束

- 新增页面数据先加到 Mock JSON，再通过 API/仓库进入页面。
- 渲染函数不发请求，不直接改 Mock 数据。
- 交互函数不拼业务数据结构，不直接调用 API 和状态机，只调用 controllers。
- 后续接真实后端时，优先替换 `src/api/appApi.js`，尽量不动 controllers/render/interactions。
