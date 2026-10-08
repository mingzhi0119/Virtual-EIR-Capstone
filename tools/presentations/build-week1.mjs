// Editable faculty-update deck. Requires the bundled artifact runtime, no install.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const workspaceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SKILL_DIR = process.env.SKILL_DIR
const RUNTIME_NODE_MODULES = process.env.RUNTIME_NODE_MODULES
const RUNTIME_PYTHON = process.env.RUNTIME_PYTHON
for (const [key, value] of Object.entries({ SKILL_DIR, RUNTIME_NODE_MODULES, RUNTIME_PYTHON })) {
  if (!value || !path.isAbsolute(value)) throw Error(`Set an absolute ${key}`)
}
const { Presentation, PresentationFile, FileBlob } = await import(pathToFileURL(
  path.join(RUNTIME_NODE_MODULES, '@oai/artifact-tool/dist/artifact_tool.mjs')).href)
const { resolvePresentationFont, finalizePresentation } = await import(pathToFileURL(
  path.join(SKILL_DIR, 'container_tools/artifact_tool_utils.mjs')).href)
const font = resolvePresentationFont({ fontFamily: 'Arial' })
const buildDir = path.join(workspaceDir, 'var/presentation-build-20261008')
const outputDir = path.join(workspaceDir, 'deliverables/2026-10-08')
const finalPath = path.join(outputDir, process.env.DECK_FILENAME || 'Virtual-EIR-Week1-v2.pptx')
await fs.mkdir(buildDir, { recursive: true })
await fs.mkdir(outputDir, { recursive: true })

const sources = {
  meeting: 'https://chatgpt.com/s/cx_6ac7ea276e00819180185b7e9114a6db',
  goat: 'https://github.com/mingzhi0119/GOAT_AI/tree/9788ffab4a70f3dec6406778d1dc26f302b762f8',
  repo: 'https://github.com/mingzhi0119/Virtual-EIR-Capstone',
  archive: 'docs/archive/2026-10-08-goat-reuse.md',
  real: 'docs/archive/2026-10-08-real-demo.json',
  ui: 'docs/archive/2026-10-08-ui-proof.json',
  drafts: 'docs/PROTOTYPE_BRIEF.md',
  weekly: 'docs/WEEKLY_DELIVERABLES.md',
  pr: 'https://github.com/mingzhi0119/GOAT_AI/pull/28',
  pathPr: 'https://github.com/mingzhi0119/GOAT_AI/pull/29',
}
const specs = [
  {
    title: 'Virtual EIR', kind: 'cover', seconds: 20,
    subtitle: 'A local prototype for continuous founder coaching',
    speaker: 'Today I will show our first Virtual EIR prototype, built on my existing GOAT AI platform. The goal is continuity: when a founder returns, the coach should use the project background and the actual results of the previous action. This is a local demonstration with a fictional venture.',
    cue: '开场明确：这是第一周本地原型，重点是连续指导，不是正式上线。',
    sourceKeys: ['weekly', 'goat', 'archive'],
  },
  {
    title: 'This week’s agreed scope', kind: 'table', seconds: 35,
    headers: ['Meeting direction', 'Current deliverable'], widths: [455, 681],
    rows: [
      ['User journey', 'Draft flow for intake and return visits'],
      ['Entrepreneur profile', 'Draft template and editable saved state'],
      ['Coaching framework', 'Draft questions, evidence checks and actions'],
      ['Two-session example', 'Real local model run with fictional data'],
      ['Text prototype', 'Working chat with confirmed project context'],
    ],
    foot: 'Drafts and prototype await faculty and EIR review',
    speaker: 'At our last discussion, we proposed a user journey, an entrepreneur profile, and a coaching framework. We also proposed an initial session and a follow-up using a mock venture. Those drafts now have a working text prototype behind them. I am bringing the flow and its limitations for feedback rather than claiming that the coaching method is already validated.',
    cue: 'W1–W5 来自会上提出并获认可的方向。草稿已完成，但老师尚未审阅。',
    sourceKeys: ['meeting', 'weekly', 'drafts'],
  },
  {
    title: 'Existing platform and new Capstone work', kind: 'table', seconds: 35,
    headers: ['GOAT AI foundation', 'New Virtual EIR layer'], widths: [545, 591],
    rows: [
      ['React interface and FastAPI backend', 'A focused founder-coaching interface'],
      ['Ollama chat and conversation history', 'Context from the same venture in a new session'],
      ['Model selection and runtime services', 'Confirmed profile, evidence and action records'],
      ['Existing test and contract tooling', 'Correction, persistence and demo boundary tests'],
    ],
    foot: 'Local Ollama with gemma4:26b on RTX 5090. No paid model API calls',
    speaker: 'GOAT already provided the general chat platform and local model connection. The Capstone work adds explicit venture state: what the founder assumes, what evidence they report, what action they planned, and what they actually completed. The new service uses GOAT’s existing chat endpoint. I keep the original platform and the new contribution clearly separate in the repository.',
    cue: '清楚说明复用来源，不能把 GOAT 原平台全算本周新开发。',
    sourceKeys: ['goat', 'repo', 'archive'],
  },
  {
    title: 'First consultation: campus dinner delivery', kind: 'initial', seconds: 40,
    speaker: 'Our fictional founder wants to offer campus dinner delivery. They assume that students care most about speed, but they have no interviews yet and can interview at most five people this week. The coach asks about recent dinner experiences and existing alternatives, then proposes five interviews. The founder reviews and saves the plan. The assistant cannot mark that work as completed.',
    cue: '虚构案例，尚无访谈。行动是建议，必须人工确认保存。不要逐字朗读模型长回复。',
    sourceKeys: ['real', 'drafts'],
  },
  {
    title: 'Follow-up: saved results change the advice', kind: 'followup', seconds: 45,
    speaker: 'Before the follow-up, the founder saves two interview results. Both fictional students reported more concern about price than speed. I then create an entirely new session without pasting the old conversation. The coach reads the saved state, distinguishes five planned interviews from two completed interviews, and recommends exploring price and alternatives in the remaining three. It also warns that two interviews cannot establish market demand.',
    cue: '5 是计划，2 是实际，3 是剩余。price 只是两个虚构样本的反馈，不能说市场验证。',
    sourceKeys: ['real', 'archive'],
  },
  {
    title: 'Founder confirmation and coaching flow', kind: 'table', seconds: 40,
    headers: ['Stage', 'Founder or coach responsibility'], widths: [355, 781],
    rows: [
      ['Intake', 'Founder states customer, problem and constraints'],
      ['Clarification', 'Coach asks about assumptions and existing evidence'],
      ['Action', 'Coach proposes a small test and explains its purpose'],
      ['Confirmation', 'Founder reviews, corrects and saves project state'],
      ['Return visit', 'Coach loads saved state and reviews reported results'],
    ],
    foot: 'Model suggestions never overwrite confirmed facts automatically',
    speaker: 'The coaching framework starts with clarification and evidence, followed by a small action and a return visit. The important control is founder confirmation. The founder can correct the profile and the results, while the model only proposes changes. We preserve revisions and full conversation records. Automatic summaries and automatic fact extraction remain future work.',
    cue: '把指导框架和实现的确认边界讲清楚。没有自动摘要或自动资料提取。',
    sourceKeys: ['drafts', 'archive'],
  },
  {
    title: 'Demonstration evidence and current limits', kind: 'evidence', seconds: 35,
    speaker: 'We have verified complete local model replies, context in a new session, profile correction, and recovery after restarting the service. These checks demonstrate the flow and persistence. They do not demonstrate expert coaching quality. Some model questions still risk leading the respondent. The prototype also lacks user authentication and has unresolved dependency warnings, so I restrict it to local fictional cases.',
    cue: '运行成功不等于专家质量认可。无登录，安全告警未关闭，只在本地用虚构资料。',
    sourceKeys: ['archive', 'real', 'ui'],
  },
  {
    title: 'Next steps and feedback requested', kind: 'next', seconds: 40,
    speaker: 'The next step is to use this concrete example to refine our questions for Ain. I would value feedback on missing intake information and whether the follow-up questions lead to useful validation work. We would also like an approved mentoring template or anonymized case, if available. After that, we can assess several fictional ventures with a consistent rubric. Local testing needs no API key today.',
    cue: '请老师针对实际流程反馈，再带具体缺口找 Ain。资料权限和以后云 API 都需另外确认。',
    sourceKeys: ['weekly', 'drafts', 'archive'],
  },
  {
    title: 'Appendix: implementation and validation', kind: 'technical', seconds: 0,
    speaker: 'Use this appendix only if the audience asks about implementation. GOAT and EIR run as separate loopback services. EIR loads confirmed state and current-session history, then calls the existing GOAT SSE endpoint. Local checks passed. Remote Windows CI revealed path-comparison failures that an earlier success status masked. We reproduced and fixed those assertions, and the remote rerun is pending. The source syncs through private GitHub. Models and databases require separate installation or backup.',
    cue: '备问页，不必主动读测试数字。组员本周不邀请；代码同步不等于数据库同步。',
    sourceKeys: ['archive', 'repo', 'pr', 'pathPr'],
  },
  {
    title: 'Appendix: recorded demo fallback', kind: 'fallback', seconds: 0,
    speaker: 'If a live model call fails or runs slowly, explain that the next output is a recorded test from October 8, not a live response. The original Chinese input and output are in the evidence file. The English descriptions on the slides paraphrase those records. No real interviews or real founder data appear in the demonstration.',
    cue: '若现场失败，明确切换“10 月 8 日记录回放”，不能冒称实时回答。',
    sourceKeys: ['real', 'archive'],
  },
]
const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } })
const colors = { ink: '#172B3A', muted: '#4B626D', accent: '#15635D', paper: '#F8FAF9' }
function text(slide, value, x, y, w, h, size=28, opts={}) {
  const shape = slide.shapes.add({ geometry: 'textbox', position: { left:x, top:y, width:w, height:h }, fill:'none', line:{fill:'none',width:0} })
  shape.text = value
  shape.text.style = { typeface:font, fontSize:size, color:opts.color || colors.ink,
    bold:opts.bold || false, wrap:'square', autoFit:'none', verticalAlignment:'top',
    insets:{top:0,bottom:0,left:0,right:0} }
  return shape
}
function table(slide, headers, rows, widths, top=170, height=370) {
  const values = [headers, ...rows]
  const t = slide.tables.add({ rows:values.length, columns:headers.length, left:72, top, width:1136, height,
    columnWidths:widths, values })
  t.borders.assign({fill:'#D6E0DD',width:1,style:'solid'})
  for (let r=0;r<values.length;r++) {
    t.rows[r].height=height/values.length
    for (let c=0;c<headers.length;c++) {
      const cell=t.getCell(r,c)
      cell.fill=r===0?colors.accent:(r%2?'#FFFFFF':colors.paper)
      cell.text.style={typeface:font,fontSize:25,bold:r===0,color:r===0?'#FFFFFF':colors.ink,
        autoFit:'none',insets:{left:16,right:16,top:12,bottom:10},verticalAlignment:'middle'}
    }
  }
  return t
}
for (const [index,spec] of specs.entries()) {
  const slide=presentation.slides.add()
  slide.background.fill=index===0?colors.ink:'#FFFFFF'
  if (spec.kind==='cover') {
    text(slide,spec.title,72,178,1136,108,80,{bold:true,color:'#FFFFFF'})
    text(slide,spec.subtitle,72,313,1000,100,36,{color:'#D5EBE4'})
    text(slide,'Mingzhi\nFaculty discussion draft, 8 October 2026',72,531,1050,95,25,{color:'#D5EBE4'})
  } else {
    text(slide,spec.title,72,52,1136,92,44,{bold:true})
    if(spec.kind==='table') {
      table(slide,spec.headers,spec.rows,spec.widths)
      text(slide,spec.foot,72,575,1136,75,25,{color:colors.muted})
    } else if(spec.kind==='initial') {
      text(slide,'Fictional founder',72,178,500,45,30,{bold:true,color:colors.accent})
      text(slide,'Campus dinner delivery\nIdea stage, no interviews yet\nHypothesis: speed matters most\nCapacity: five interviews this week',72,245,535,220,29)
      text(slide,'Initial coaching proposal',680,178,525,45,30,{bold:true,color:colors.accent})
      text(slide,'Ask about recent dinner experiences\nand existing alternatives.\n\nInterview five students and record\nbehaviors, concerns and context.',680,245,525,260,29)
      text(slide,'Founder reviews and saves the plan. English paraphrase of the recorded Chinese response.',72,570,1120,80,24,{color:colors.muted})
    } else if(spec.kind==='followup') {
      for(const [x,n,label] of [[72,'5','Planned interviews'],[465,'2','Completed interviews'],[865,'3','Remaining interviews']]) {
        text(slide,n,x,164,310,115,90,{bold:true,color:colors.accent})
        text(slide,label,x,288,330,48,29)
      }
      text(slide,'New observation',72,387,310,45,28,{bold:true})
      text(slide,'Both fictional respondents report more concern about price than speed.',395,387,790,80,28)
      text(slide,'Next action',72,495,310,45,28,{bold:true})
      text(slide,'Explore price and alternatives in the remaining three interviews.',395,495,790,80,28)
      text(slide,'New session, saved context. Two convenience samples cannot establish market demand.',72,611,1136,66,23,{color:colors.muted})
    } else if(spec.kind==='evidence') {
      text(slide,'Verified locally',72,170,530,47,31,{bold:true,color:colors.accent})
      text(slide,'Real model replies in two sessions\nSaved context without pasted history\nCorrection and restart recovery\nProject association checks',72,242,535,240,29)
      text(slide,'Still open',685,170,520,47,31,{bold:true,color:colors.accent})
      text(slide,'Faculty and EIR coaching review\nSeveral cases and a scoring rubric\nLogin and user authorization\nDependency security remediation',685,242,520,240,29)
      text(slide,'Current boundary: one local user, fictional data, no public deployment',72,558,1136,86,28,{bold:true})
    } else if(spec.kind==='next') {
      text(slide,'Immediate discussion',72,172,560,45,31,{bold:true,color:colors.accent})
      text(slide,'What essential intake information is missing?\n\nWhich follow-up questions need revision?',72,242,555,220,29)
      text(slide,'Following this review',686,172,520,45,31,{bold:true,color:colors.accent})
      text(slide,'Bring concrete gaps to Ain.\nRequest approved mentoring materials.\nEvaluate several fictional ventures.\nConfirm team roles next week.',686,242,520,250,29)
      text(slide,'Ain’s process and evaluation criteria remain unconfirmed. Local testing needs no API key.',72,575,1136,83,25,{color:colors.muted})
    } else if(spec.kind==='technical') {
      table(slide,['Surface','Recorded evidence'],[
        ['Model and hardware','Ollama, gemma4:26b, RTX 5090, about 22 GB VRAM'],
        ['EIR prototype tests','18 deterministic tests and 14 headless UI checks'],
        ['GOAT regressions','540 backend/contract tests, 8 skipped, 217 frontend tests'],
        ['Upstream fixes','Thinking controls and path assertions, PRs #28/#29 open'],
        ['Operation','Loopback only. Code syncs through private GitHub'],
      ],[365,771],170,390)
      text(slide,'CI lint and dependency blockers remain. UI feedback uses mocks, with separate real-model proof.',72,594,1136,72,24,{color:colors.muted})
    } else if(spec.kind==='fallback') {
      table(slide,['Recorded step','What the evidence demonstrates'],[
        ['First consultation','Five-person plan with questions about recent experiences'],
        ['Founder confirmation','Plan 5, completion 2, sample size 2, profile revision 3'],
        ['New follow-up session','Advice uses saved price observations and 3 remaining interviews'],
        ['Real process restart','Profile and conversation records recover'],
      ],[385,751],170,344)
      text(slide,'Latest recorded replies: 20.785 s and 14.375 s. One case, not a latency benchmark.',72,545,1136,75,25,{color:colors.muted})
      text(slide,'If live chat fails, identify this as a recorded test. Full Chinese output stays in the evidence file.',72,622,1136,57,23,{color:colors.muted})
    }
    text(slide,String(index+1),1167,686,42,26,17,{color:colors.muted})
  }
  slide.speakerNotes.textFrame.setText(`${spec.speaker}\n\nSOURCES (internal project files unless a URL is shown)\n${spec.sourceKeys.map(k=>sources[k]).join('\n')}\n\nSTATUS: fictional local prototype. Faculty/EIR review pending.`)
}

const candidatePath=path.join(buildDir,'candidate.pptx')
await (await PresentationFile.exportPptx(presentation)).save(candidatePath)
const result=await finalizePresentation({
  workspaceDir,candidatePath,finalPath,pythonExecutable:RUNTIME_PYTHON,
  integrityValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit',
    ...[2,3,6,9,10].flatMap(n=>['--require-native-table-slide',String(n)])],
  requiredNativeTableOwnerSlides:[2,3,6,9,10],
  fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,
  receiptPath:path.join(buildDir,`${path.basename(finalPath)}.validation.json`),
})
console.log(JSON.stringify(result))
// Render the exported final file, not merely the authoring model.
const verified=await PresentationFile.importPptx(await FileBlob.load(finalPath))
for(let i=0;i<verified.slides.items.length;i++) {
  const slide=verified.slides.items[i]
  const png=await verified.export({slide,format:'png',scale:1})
  await fs.writeFile(path.join(buildDir,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()))
  const layout=await slide.export({format:'layout'})
  await fs.writeFile(path.join(buildDir,`slide-${String(i+1).padStart(2,'0')}.layout.json`),await layout.text())
}
const speech=[
  '# Virtual EIR：第一周英文演讲稿与中文提示',
  '',
  '适用：老师例会。8 页主讲 + 2 页备问，预计主讲约 5 分钟，另留 60–90 秒演示；总时长约 6–7 分钟，须以实际排练为准。没有核对最新会议邀请，PPT 使用成果日期而非声称正式会议日期。',
  '',
  '英文内容也在 PPT 的 Speaker Notes 中。下面的中文提示不必对老师读出。示例均为虚构，不存在已完成真实访谈的声明。',
  '',
  ...specs.flatMap((s,i)=>[`## Slide ${i+1}: ${s.title}`, '', s.speaker, '', `中文提示：${s.cue}`, '', ...(i===4?[
    '### 现场演示插入点（60–90 秒）','',
    '先用已保存的虚构项目，显示 target_count=5 / completed_count=2。新建跟进会话，发送简短复盘问题，等待本地模型回复，再指认模型读取的 5/2/3 与价格反馈。不要为了省时间粘贴旧对话。', '',
    '**Live-demo transition:** “I will now open the local prototype. The founder has confirmed the interview results here. This is a new session, and the coach will read the saved venture state.”', '',
    '**Recorded fallback:** “The live service is not responding as expected, so I will use the recorded October 8 test. This is a recorded response, not a live one. It demonstrates the saved context and the follow-up, while the original output remains available for inspection.”','',
    '模型建议若出现引导性问法，直接说明这是待专家评审的缺点，不即兴宣称已解决。','',
  ]:[])]),
  '## 备问：简短回答','',
  '**What is new beyond GOAT?** “GOAT supplies the general chat platform. The new work adds founder-confirmed venture state, explicit action progress, correction, and context in a new session.”','',
  '**Does the AI remember automatically?** “The service loads saved state automatically. The founder still explicitly confirms changes. We have not implemented automatic fact extraction or summaries.”','',
  '**Do we need a paid API key?** “Local testing currently uses an existing Ollama model and GPU. No paid model API calls were made. If evaluation shows we need a cloud model, we will propose the provider, usage and spending cap first.”','',
  '**Can real users access it now?** “The prototype runs locally with fictional cases. Authentication, user authorization and dependency security work remain before shared or public use.”','',
  '**Has Ain approved this method?** “No. The flow is our proposed general framework. We would like feedback and approved materials before claiming an Ain-specific method.”','',
  '**Who did the first-week implementation?** “I am handling the initial setup this week. We will confirm team roles and repository access next week.”','',
  '**How do we treat earlier code?** “We document the original GOAT baseline separately from the new Capstone layer and will confirm the course’s expectations for reuse and contribution attribution.”','',
  '## 会前检查','',
  '- 启动 `scripts/start-local.ps1`，确认两个本地入口与 Ollama 可用。',
  '- 打开 PPT 及演讲稿，使用一个已有虚构案例，避免现场展示测试项目列表或私人资料。',
  '- 先按备问第 10 页准备记录回放。现场失败时明确说 recorded test。',
  '- 在自己的 PowerPoint 中试放一遍，确认字体和版式；本轮已检查导出渲染，但不声称在 PowerPoint 应用中试放过。',
  '- 确认实际例会时间。旧“周五 11 点”安排尚未读取当前邀请。','',
  '## 来源与状态','',
  ...Object.entries(sources).map(([k,v])=>`- ${k}: ${v}`),'',
  '时长为排练规划，不是计时保证。中文模型输出的英文说明均为意译，不是模型生成的英文原文。技术测试仅支持本轮原型范围，不证明专家指导质量、安全就绪或全部上游 CI。',
]
await fs.writeFile(path.join(outputDir,'Speaker-Script.md'),speech.join('\n'))
await fs.writeFile(path.join(outputDir,'Slide-Content.json'),JSON.stringify({date:'2026-10-08',sources,slides:specs},null,2))
console.log(`Final deck and speech ready: ${finalPath}`)
