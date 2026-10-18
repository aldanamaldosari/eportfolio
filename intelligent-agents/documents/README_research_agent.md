# Academic Research Planning Agent

An LLM-powered agent that turns a broad research goal into a reviewed evidence package. It plans
searchable sub-questions, retrieves live scholarly records from Crossref and OpenAlex, ranks them,
writes claims that quote their sources, checks every quotation against the source abstract, and
exports a report only after a person approves it. It implements the six-role design from the
Group E design report (Unit 6).

## Contents

| Item | Purpose |
|---|---|
| `01_Research_Agent.ipynb` | Main notebook: writes the application code, runs one research goal end to end in Google Colab, and saves the evidence |
| `research_agent/`, `requirements.txt` | Application code and pinned dependencies, as written by the notebook |
| `app.py` | Streamlit web interface for the same agent; it imports `research_agent` unchanged |
| `requirements_app.txt` | Dependencies for the Streamlit app (`requirements.txt` plus Streamlit and pandas) |
| `runs/` | LangGraph checkpoints and the approved exports of runs `0e82cee4…` and `64b6a9c7…` |
| `evidence/` | Diagnostics for all three live runs and the environment record |
| Presentation (`.pptx`) | Slides with the narration script in the speaker notes |
| `README.md` | This file |

When the notebook runs, it creates this project folder:

```
research_agent_project/
├── app.py                    Streamlit interface (added separately, not written by the notebook)
├── requirements_app.txt      Streamlit app dependencies
├── requirements.txt          pinned dependencies
├── research_agent/
│   ├── models.py             Pydantic data contracts and settings
│   ├── retrieval.py          Crossref/OpenAlex adapters, deduplication and ranking
│   ├── llm.py                Hugging Face model gateway with schema repair
│   ├── validation.py         deterministic evidence checks
│   ├── export.py             report rendering and approved export
│   ├── workflow.py           LangGraph six-role workflow
│   └── __init__.py
├── runs/
│   ├── checkpoints.sqlite    LangGraph checkpoints (persistent state)
│   └── exports/<run_id>/     approved evidence package
└── evidence/                 run diagnostics and environment record
```

## How it works

| Role | Implementation |
|---|---|
| Planner | The hosted model decomposes the goal into 2–4 sub-questions, each with a search query, a rationale and a scope note |
| Academic Retrieval | Searches Crossref and OpenAlex for every sub-question (8 records per query). HTTP 429 and 5xx responses are retried up to 3 times, honouring `Retry-After`. A second pass uses the broader sub-question text as the query |
| Processing and Ranking | Merges duplicates by DOI or title, scores relevance as 0.65 × title overlap + 0.35 × abstract overlap, keeps the top 10, and asks the model for one claim per usable abstract with a 20–60-word quotation |
| Evidence Validator | Deterministic checks, separate from the model: at least 3 relevant records and 2 usable abstracts, no synthetic records, no unknown or duplicate citation IDs, and every quotation (at least 10 words) found verbatim in its abstract |
| Orchestrator/Supervisor | Routes a failed check: retrieval problems → one retrieval retry; processing problems → one processing retry; then one re-plan; then stop |
| Storage/Export | A LangGraph `interrupt` pauses the run; export happens only after an explicit Boolean approval |

```
planner → retrieval → processing → validator → supervisor
supervisor → retrieval | processing | planner | approval | stop
approval → exporter (approved) | stop (rejected)
```

The six roles run inside one Python/LangGraph process; they are not six separately deployed
services. The design follows Prometheus role decomposition (Padgham and Winikoff, 2003),
Plan-and-Execute, and a bounded reasoning-and-acting loop (Yao et al., 2023).

### Safeguards in the code

- Model output must match a Pydantic schema (unexpected fields are rejected); one repair attempt
  is allowed, then the run fails safely.
- The goal and retrieved records are passed to the model as untrusted data, never as
  instructions. API URLs are fixed in the code, never taken from model output.
- HTTP error messages leave out request URLs, which could contain API keys.
- Approval accepts only a Boolean, so a string such as `"false"` cannot approve an export.
- CSV cells starting with `=`, `+`, `-` or `@` are escaped to prevent spreadsheet formula injection.
- Export files are written atomically, and a SHA-256 `manifest.json` is written last so an
  incomplete export can be detected.

## Installation and running (Google Colab)

1. Upload `01_Research_Agent.ipynb` to Colab.
2. In Section 2, set `GOAL` (and, if needed, `MODEL_ID`, `PROVIDER` and `USE_OPENALEX`).
3. Choose **Runtime → Run all**. Section 1 writes the code files and installs `requirements.txt`.
4. Paste your Hugging Face token into the hidden prompt when it appears, then press Enter.
5. Section 3 runs the agent; Section 4 shows the draft report and the full decision history.
6. In Section 5, type `APPROVE` (case-sensitive) to export, or press Enter to reject.
7. Section 6 saves diagnostics and downloads `Research_Agent_Workspace.zip`. Save the executed
   notebook with **File → Download → Download .ipynb**.

| Setting | Default / purpose |
|---|---|
| `MODEL_ID` | `Qwen/Qwen2.5-72B-Instruct` |
| `PROVIDER` | `deepinfra` (Hugging Face Inference Providers) |
| `USE_OPENALEX` | `True`; recommended because Crossref often lacks abstracts |
| HF token | Entered in a hidden prompt each run; kept only in the current runtime, never written to the notebook or project files |
| `OPENALEX_API_KEY`, `CROSSREF_MAILTO` | Optional; read from Colab Secrets if present |

Inference needs available Hugging Face credits; a token by itself does not provide credits. If a
model call fails, the notebook explains the likely cause (invalid token, no credits, no model
access, model unavailable, or rate limit).

**Note:** the last `%%writefile README.md` cell in Section 6 overwrites the project folder's
README with a short version. Submit this README separately, or paste it into that cell first.

**Environment of the recorded runs:** Google Colab, Python 3.13 (`evidence/environment.json`).

**Dependencies** (`requirements.txt`): `langgraph==1.2.14`, `langgraph-checkpoint-sqlite==3.1.1`,
`pydantic==2.13.5`, `requests==2.34.2`, `huggingface-hub==2.2.0`.

## Streamlit app (local web interface)

`app.py` provides a browser interface to the same six-role agent. It imports the `research_agent`
package without modifying it and uses the same `runs/` and `evidence/` folders as the notebook.

### Install and open (macOS / Linux, Python 3.11+)

Run these commands in Terminal:

```bash
cd ~/Desktop/"research_agent_project 2"        # the project folder
python3 -m pip install -r requirements_app.txt
python3 -m streamlit run app.py
```

Streamlit opens the app in your browser at **http://localhost:8501**. If it does not open
automatically, paste that address into the browser. Press `Ctrl+C` in Terminal to stop the app.

On Windows (PowerShell), run the same commands from the project folder with `python` in place of
`python3`.

### Using the app

| Mode | What it does | Needs a token? |
|---|---|---|
| **Browse saved runs** | Lists every run in `runs/exports/` and `evidence/`. For each run it shows status, record and claim counts, and re-plans, with tabs for the report, plan, quoted claims, ranked sources, decision history and validation. For approved runs it re-checks every export file against `manifest.json` and offers each file for download | No; works offline |
| **Run new research** | Enter a goal, model, provider and Hugging Face token, then select **Plan, retrieve and validate**. Review the claims and sources, tick *I have reviewed the sources and claims*, then select **Approve and export** or **Reject** | Yes |

Credential handling: the token field is a password field. The token is held in the app's memory
for the current session only and is never written to disk. `OPENALEX_API_KEY` and
`CROSSREF_MAILTO` can be entered under *Optional keys and limits*. As in the notebook, nothing is
exported without explicit approval, and a diagnostic file is saved in `evidence/` for every run.

## Outputs

An approved run writes `runs/exports/<run_id>/`:

| File | Contents |
|---|---|
| `report.md` | Search plan, evidence statements with quotations and source links, limitations, validation result |
| `sources.csv` | One row per ranked record (title, DOI, year, authors, URL, sources, score, abstract) |
| `run.json` | Full run state: settings, plan, records, synthesis, validation, approval, events |
| `events.jsonl` | Timestamped decision history of every role |
| `manifest.json` | SHA-256 hash of each exported file |

The `evidence/` folder keeps `<run_id>_diagnostic.json` for successful, rejected and failed runs,
plus `environment.json` (Python version, settings and package versions).

## Evidence of execution

**Live run** (11 October 2026, Run ID `0e82cee494a64489bb3425c0b550d7b4`, model
`Qwen/Qwen2.5-72B-Instruct` via `deepinfra`). The goal was: *"What is the best exercise protocol for
reducing knee joint pain?"*

| Time (UTC) | Role | What happened |
|---|---|---|
| 10:34:03 | Planner | Plan with 3 sub-questions: exercise types, frequency and duration, long-term effects |
| 10:34:04–07 | Academic Retrieval | 6 searches (3 queries × Crossref and OpenAlex), 8 records each, in 3.3 s |
| 10:34:42 | Processing | 10 unique records, 10 usable abstracts, claims written |
| 10:34:42 | Validator → Supervisor | Failed: quotations for two sources (`P54bb715b77b6`, `P6f423694f0cb`) not found in their abstracts; routed to a processing retry |
| 10:35:14 | Processing → Validator | Retry failed on the same two quotations; Supervisor escalated to a re-plan |
| 10:35:22 | Planner | Re-plan 1 with revised queries |
| 10:35:23–26 | Academic Retrieval | 6 new searches, 8 records each, in 3.8 s |
| 10:35:58 | Processing → Validator | **Passed**: 10 records, 10 abstracts, 6 grounded claims; routed to approval |
| After review | Human | Typed `APPROVE`; status `exported` |

This run exercised the whole recovery path: a failed check, a targeted processing retry, a
re-plan, then validation, human approval and export. The validator still warned that quote
matching checks attribution, not whether every inference is justified, and that abstracts are not
full texts.

The exported `report.md` contains 6 evidence statements, each with a quotation that passed the
exact-match check. They include the two results on slide 5, which were measured on different
populations and scales and so cannot be ranked against each other: stretching over 8 weeks (NRS
37.14 → 28.24) and swing exercise over 7 days (7.15 → 6.00). They also include the START trial on
slide 6 (Messier et al., 2021), the strongest comparative source retrieved. At the 18-month WOMAC
pain follow-up it found no statistically significant advantage for high intensity: Δ 0.2
[-0.6, 1.1], p = .61 versus attention control, and Δ 0.7 [-0.1, 1.6], p = .08 versus low intensity.

**Integrity check:** the SHA-256 hashes in `manifest.json` match `report.md`, `run.json`,
`sources.csv` and `events.jsonl` exactly, so the exported files have not changed since export.

**Earlier live run, rejected by the reviewer** (11 October 2026, Run ID
`a2495ada80c34dabbe461ba449357e51`, notebook default goal *"How can passive cooling reduce energy
use in school buildings?"*). Its diagnostics are in `evidence/`.

| Time (UTC) | What happened |
|---|---|
| 10:26:06–09 | Plan, then 6 searches across Crossref and OpenAlex |
| 10:27:30 | The model returned invalid structured output twice; with no valid synthesis, the Supervisor routed to a processing retry |
| 10:27:58 | The retry produced claims, but 3 quotations did not match their abstracts; re-plan |
| 10:28:07–10:28:59 | New plan, 6 new searches, and validation passed |
| 10:32:15 | The reviewer rejected the package; status `rejected`, nothing exported |

**Live run through the Streamlit app** (12 October 2026, Run ID
`64b6a9c76f374d5c8cab23c0fc83cb2e`, `Qwen/Qwen2.5-72B-Instruct` via `deepinfra`, same knee-pain goal):

| Time (UTC) | What happened |
|---|---|
| 14:17:32 | Plan with 3 sub-questions: exercise types, frequency and duration, long-term effects |
| 14:17:33–40 | 6 searches across Crossref and OpenAlex, 8 records each |
| 14:18:33 | 10 unique records and 10 usable abstracts; two quotations did not match their abstracts, so the Supervisor routed to a processing retry |
| 14:19:14 | The retry passed validation with 10 records, 10 abstracts and 5 grounded claims, without a re-plan |
| 14:19:42 | The reviewer approved the package in the app, and it was exported |

The export's SHA-256 hashes match `manifest.json`. One of the five grounded claims comes from a
study of medial arch support for foot, heel and back pain. The quotation is genuine, but the study
is only loosely relevant to knee pain, which shows why human review stays necessary.

Together, the three runs exercise schema-repair failure, a processing retry that recovers on its
own, a processing retry that needs a re-plan, approval with export (notebook and app), and
rejection without export.

## Testing

**Summary: 55 offline automated tests passed, plus 3 live end-to-end runs (2 approved and exported, 1 rejected): two from the notebook and one from the Streamlit app.**

| Evidence | Status in this submission |
|---|---|
| **Live end-to-end runs** (`0e82cee4…` approved and `a2495ada…` rejected, from the notebook; `64b6a9c7…` approved, from the Streamlit app; see above) | Produced by `01_Research_Agent.ipynb` and `app.py`, with all decisions recorded in `events.jsonl` and the `evidence/` diagnostics. Together they cover invalid model output, the processing retry, quotation failure, re-planning, approval with export, and rejection without export. Export integrity was confirmed against `manifest.json` |
| **55 offline automated tests** — all passed, 96.09% statement coverage of the core source | Run offline with mock model and API clients, so routing, structured data, source matching, approval, export, error handling and notebook wiring are tested without a live model or academic API. The test suite was run separately and is not part of `01_Research_Agent.ipynb` |
| **Testability of the code** | The model gateway (`ModelGateway(client=...)`) and the agent (`ResearchAgent(model=..., api=...)`) accept injected clients, so routing and failure handling can be tested with mocks and without live services |
| **Planned evaluation** (slide 9) | A 24-goal evaluation against a direct-search baseline, with manual rating of relevance and claim support and a confidence interval for the results. Not yet run |

The design report's 90% error-free target is a future evaluation criterion; it is not a result
claimed here (slide 8). Three live runs show that the control flow works on a real goal; it does not
show reliability across topics or that the generated claims are correct.

## Remediation log

| Issue found | Evidence | Fix |
|---|---|---|
| Two claims quoted text that did not appear verbatim in their abstracts, and a processing retry repeated the error | `events.jsonl` for run `0e82cee4…` | Supervisor escalated to a re-plan with revised queries; the new evidence passed every quotation check before approval |
| The model returned output that failed the schema twice in a row | `evidence/a2495ada…_diagnostic.json` | Handled by the bounded repair attempt and processing retry; the run recovered without manual intervention |
| [Add any bug you found and fixed while building or running the agent] | [error message or test output] | [what you changed] |

## Limitations

- 55 offline tests and three live runs (two approved, one rejected) show that the workflow executes and recovers; they cannot estimate reliability across topics.
- Exact-quotation checks confirm attribution, not that every summary inference is correct.
  Review sources and claims before use.
- The relevance score measures term overlap with the goal, not study quality.
- Evidence comes from metadata and abstracts, which are often incomplete; full-text appraisal is
  still required.
- The model is hosted, so runs depend on provider availability and Hugging Face credits.
- The Colab disk is temporary; download the workspace archive before the session ends.
- The approval gate prevents unreviewed exports, but its value depends on the reviewer's attention.

## References

Crossref (2026) *REST API: metadata retrieval*. Available at: https://www.crossref.org/documentation/retrieve-metadata/rest-api/ (Accessed: 11 October 2026).

Domini, D. (2026) 'Effect of swing exercises on knee joint pain among elderly people in selected old age home of Ernakulam District', *IOSR Journal of Nursing and Health Science*, 15(2), pp. 54–58. doi:10.9790/1959-1502025458.

Hugging Face (2026) *Inference Providers*. Available at: https://huggingface.co/docs/inference-providers/en/index (Accessed: 11 October 2026).

LangChain (2026) *LangGraph overview*. Available at: https://docs.langchain.com/oss/python/langgraph/overview (Accessed: 11 October 2026).

Messier, S.P. et al. (2021) 'Effect of high-intensity strength training on knee pain and knee joint compressive forces among adults with knee osteoarthritis: the START randomized clinical trial', *JAMA*, 325(7), pp. 646–657. doi:10.1001/jama.2021.0411.

OpenAlex (2026) *API reference: introduction*. Available at: https://developers.openalex.org/api-reference/introduction (Accessed: 11 October 2026).

Padgham, L. and Winikoff, M. (2003) 'Prometheus: a methodology for developing intelligent agents', in Giunchiglia, F., Odell, J. and Weiß, G. (eds) *Agent-Oriented Software Engineering III*. Berlin: Springer, pp. 174–185. doi:10.1007/3-540-36540-0_14.

*The effect of stretching exercise on reducing the intensity of osteoarthritis knee joint pain in the elderly in Kutambaru Village, Munthe District, Karo Regency* (2025) *Contemporary Journal of Applied Sciences*, 3(8). doi:10.55927/cjas.v3i8.65.

Wooldridge, M. (2009) *An Introduction to Multiagent Systems*. 2nd edn. Chichester: Wiley.

Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K. and Cao, Y. (2023) 'ReAct: synergizing reasoning and acting in language models', *Eleventh International Conference on Learning Representations (ICLR 2023)*. Available at: https://arxiv.org/abs/2210.03629 (Accessed: 11 October 2026).

Software: LangGraph, SQLite, Pydantic, Requests and Hugging Face Hub. Scholarly metadata:
Crossref and OpenAlex.

## AI-use statement

**Tool:** Claude (Anthropic), used through the Claude app, October 2026.

**What it was used for:**

- **Presentation design:** the visual layout and styling of the slides. The slide text and the
  narration script were not changed by the tool.
- **Debugging:** help diagnosing and fixing errors when running the code.
- **README:** structuring and formatting this README from my executed notebook.
- **Streamlit app:** writing `app.py`, the web interface to my existing `research_agent` package.
  The agent code itself was not changed.

**My own work:** the research agent's design, the notebook code, the live research runs and their
review and approval, the presentation content and script, and the analysis and conclusions are
my own work. I reviewed everything produced with AI assistance and I am responsible for the final
submission.
