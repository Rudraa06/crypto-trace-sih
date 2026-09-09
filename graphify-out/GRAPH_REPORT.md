# Graph Report - sih  (2026-08-30)

## Corpus Check
- 190 files · ~272,954 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1560 nodes · 2743 edges · 116 communities (87 shown, 29 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Frontend Src
- Data Agents
- Design Agents
- Cip Agents
- Search Agents
- Frontend Package
- Backend Src
- Max Agents
- Backend Src
- Backend Src
- Design Agents
- Backend Scripts
- Backend Src
- Test Config
- Test Agents
- Agents Skills
- Backend Src
- Html Agents
- Test Agents
- Env Backend
- Design Agents
- Agents Skills
- Backend Src
- Test Agents
- Config Agents
- Generate Slide
- Design Agents
- Background Agents
- Test Agents
- Generate Icon
- Design Agents
- Test Add
- Test Refresh
- Test Agents
- Agents Skills
- Test Agents
- Backend Package
- Agents Skills
- Agents Skills
- Backend Scripts
- Design Agents
- Agents Skills
- Test Agents
- Backend Scripts
- Generate Logo
- Agents Skills
- Design Agents
- Add Agents
- Shadcn Add
- Config Agents
- Brand Agents
- Tokens Agents
- Design Agents
- Test Add
- Test Config
- Agents Skills
- Agents Skills
- Design Agents
- Config Agents
- Agents Skills
- Test Layout
- Brand Agents
- Test Agents
- Backend Package
- Backend Package
- Design Agents
- Design Agents
- Agents Skills
- Agents Skills
- Test Mode
- Design Agents
- Test Agents
- Design Agents
- Design Agents
- Design Agents
- Design Agents
- Design Agents
- Design Agents
- Design Agents
- Brand Test
- Agents Skills
- Design Agents
- Design Agents
- Design Agents
- Design Agents
- Design Agents
- Design Agents
- Agents Skills
- Agents Skills
- Test Add
- Test Agents
- Test Agents
- Test Shadcn
- Test Agents
- Test Agents
- Test Add
- Test Agents
- Test Agents
- Test Agents
- Test Agents
- Test Config
- Test Config
- Test Config
- Test Config
- Test Config
- Test Config
- Test Config
- Test Agents
- Test Agents
- Test Config
- Test Agents
- Test Agents

## God Nodes (most connected - your core abstractions)
1. `TailwindConfigGenerator` - 58 edges
2. `search()` - 43 edges
3. `TestTailwindConfigGenerator` - 35 edges
4. `search_stack()` - 35 edges
5. `DesignSystemGenerator` - 35 edges
6. `ShadcnInstaller` - 34 edges
7. `TestShadcnInstaller` - 26 edges
8. `config` - 24 edges
9. `toChecksum()` - 21 edges
10. `logger` - 20 edges

## Surprising Connections (you probably didn't know these)
- `TestBm25CoreBehavior` --uses--> `BM25`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_core.py → .agents/skills/design/scripts/cip/core.py
- `TestTokenizer` --uses--> `BM25`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_core.py → .agents/skills/design/scripts/cip/core.py
- `TestShadcnInstaller` --uses--> `ShadcnInstaller`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_shadcn_add.py → .agents/skills/ui-styling/scripts/shadcn_add.py
- `TestGeneratedConfigIsValidJs` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .agents/skills/ui-styling/scripts/tailwind_config_gen.py
- `TestTailwindConfigGenerator` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .agents/skills/ui-styling/scripts/tailwind_config_gen.py

## Import Cycles
- None detected.

## Communities (116 total, 29 thin omitted)

### Community 0 - "Frontend Src"
Cohesion: 0.06
Nodes (42): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, ApiError, fetchConfig(), fetchHealth() (+34 more)

### Community 1 - "Data Agents"
Cohesion: 0.08
Nodes (46): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _catalog_date(), _check_app_interface_contract(), _check_catalog_contract() (+38 more)

### Community 2 - "Design Agents"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 3 - "Cip Agents"
Cohesion: 0.07
Nodes (42): BM25, detect_domain(), get_cip_brief(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection (+34 more)

### Community 4 - "Search Agents"
Cohesion: 0.08
Nodes (36): format_context(), format_result(), main(), Format a single search result for display, Format contextual recommendations for display., BM25, calculate_pattern_break(), detect_domain() (+28 more)

### Community 5 - "Frontend Package"
Cohesion: 0.05
Nodes (39): dependencies, gsap, jspdf, jspdf-autotable, lucide-react, react, react-dom, react-force-graph-2d (+31 more)

### Community 6 - "Backend Src"
Cohesion: 0.11
Nodes (31): createApp(), config, listKnownExchanges(), emit(), ESC, LEVEL_STYLE, LEVELS, logger (+23 more)

### Community 7 - "Max Agents"
Cohesion: 0.09
Nodes (36): _contains_phrase(), _domain_keywords(), _exact_match_diagnostic(), _exact_stack_identifier(), _file_signature(), _get_bm25(), _legacy_successor_guidance(), _load_csv() (+28 more)

### Community 8 - "Backend Src"
Cohesion: 0.11
Nodes (29): buildAssetRegistry(), buildTransferCategories(), GENERIC_FALLBACK, NETWORK_ASSETS, normalizeAddressOrNull(), chainContexts, fetchTransfersForChain(), getChainContext() (+21 more)

### Community 9 - "Backend Src"
Cohesion: 0.12
Nodes (26): byOperator, exchanges, fail(), readBack, assertConfigValid(), redactedConfig(), unverifiedExchanges, app (+18 more)

### Community 10 - "Design Agents"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 11 - "Backend Scripts"
Cohesion: 0.09
Nodes (28): bfsToExchanges(), buildScenario(), captured, createFakeDriver(), edge(), edgeStore, failures, fakeInt() (+20 more)

### Community 12 - "Backend Src"
Cohesion: 0.11
Nodes (25): __dirname, failures, FIXTURE_FILE, PACKAGE_ROOT, byAddress, ETH_MAINNET, ETH_SEPOLIA, getExchangeInfo() (+17 more)

### Community 13 - "Test Config"
Cohesion: 0.06
Nodes (16): Test adding colors multiple times., Test adding full color palette., Test adding custom spacing., Test adding custom breakpoints., Test TailwindConfigGenerator class., Test generating TypeScript configuration., Test validating config with empty theme extensions., Test writing configuration to file. (+8 more)

### Community 14 - "Test Agents"
Cohesion: 0.11
Nodes (6): Search stack-specific guidelines, search_stack(), _rows(), TestNativeDesktopStackFreshness, _rows(), TestWebStackFreshness

### Community 15 - "Agents Skills"
Cohesion: 0.11
Nodes (22): _detect_page_type(), format_master_md(), format_page_override_md(), _generate_intelligent_overrides(), persist_design_system(), Path, _query_wants_dark(), Format design system as MASTER.md with hierarchical override logic. (+14 more)

### Community 16 - "Backend Src"
Cohesion: 0.18
Nodes (27): toChecksum(), addCounters(), chunk(), computeRiskScore(), getGraphStats(), ingestToGraph(), partitionTransactions(), seedExchangeWallets() (+19 more)

### Community 17 - "Html Agents"
Cohesion: 0.13
Nodes (24): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+16 more)

### Community 18 - "Test Agents"
Cohesion: 0.12
Nodes (7): Resolve a deprecated in-domain alias, or expose a cross-domain redirect., Main search function with auto-domain detection, search(), _style_search_destination(), TestSearchDomains, read_rows(), TestStyleTaxonomy

### Community 19 - "Env Backend"
Cohesion: 0.09
Nodes (22): ALCHEMY_API_KEY, ALCHEMY_NETWORK, DEFAULT_TRACE_DEPTH, __dirname, __filename, float(), GRAPH_ENABLED, int() (+14 more)

### Community 20 - "Design Agents"
Cohesion: 0.11
Nodes (19): BM25, detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results (+11 more)

### Community 21 - "Agents Skills"
Cohesion: 0.11
Nodes (9): BM25, BM25 ranking algorithm for text search, Lowercase, normalize synonyms, split, remove punctuation, filter stopwords, Build BM25 index from documents, Score all documents against query, All indexed terms, for suggestion/typo-recovery purposes., TestBm25CoreBehavior, TestDiagnosticsContracts (+1 more)

### Community 22 - "Backend Src"
Cohesion: 0.14
Nodes (16): InvalidAddressError, isValidAddress(), normalizeAddress(), validateAddressParam(), complaintsRouter, VALID_FRAUD_TYPES, ingestFromChain(), traceRouter (+8 more)

### Community 23 - "Test Agents"
Cohesion: 0.16
Nodes (6): DesignSystemGenerator, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., TestReasoningMatch, read_rows(), TestReasoningContract

### Community 24 - "Config Agents"
Cohesion: 0.10
Nodes (12): main(), Add custom font families. Args: fonts: Dict of font_type: [font_names] e.g.,…, Add custom spacing values. Args: spacing: Dict of name: value e.g., {'18':…, Add custom breakpoints. Args: breakpoints: Dict of name: width e.g., {'3xl':…, Add plugin requirements. Args: plugins: List of plugin names e.g.,…, Get plugin recommendations based on configuration. Returns: List of recommended…, Generate Tailwind CSS configuration files., Validate configuration. Returns: Tuple of (valid, message) (+4 more)

### Community 25 - "Generate Slide"
Cohesion: 0.15
Nodes (19): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+11 more)

### Community 26 - "Design Agents"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 27 - "Background Agents"
Cohesion: 0.17
Nodes (17): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+9 more)

### Community 28 - "Test Agents"
Cohesion: 0.13
Nodes (3): TestFixtureValidation, TestMetricMath, TestThresholdGate

### Community 29 - "Generate Icon"
Cohesion: 0.20
Nodes (15): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+7 more)

### Community 30 - "Design Agents"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 31 - "Test Add"
Cohesion: 0.12
Nodes (9): Test adding components in dry run mode., Test ShadcnInstaller class., Test adding all components without config., Test adding all components in dry run mode., Test listing installed components without config., Test listing installed components when none exist., Test initialization with custom project root., Test checking for non-existent shadcn config. (+1 more)

### Community 33 - "Test Agents"
Cohesion: 0.23
Nodes (3): detect_domain(), Auto-detect the most relevant domain from query. Matches are weighted by…, TestDomainDetection

### Community 34 - "Agents Skills"
Cohesion: 0.14
Nodes (8): Execute searches across multiple domains., Find matching reasoning rule for a category., Apply reasoning rules to search results., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Bucket a 1-10 dial value into its tier config. Returns None if value is None., _resolve_dial()

### Community 35 - "Test Agents"
Cohesion: 0.18
Nodes (7): _palette_is_dark(), WCAG relative luminance of a #RRGGBB string, or None if unparseable., True when a colors.csv row's Background is a dark surface., _relative_luminance(), The exact reproduction from issue #428., TestEndToEndCoherence, TestLuminance

### Community 36 - "Backend Package"
Cohesion: 0.13
Nodes (15): dependencies, cors, dotenv, ethers, express, morgan, neo4j-driver, uuid (+7 more)

### Community 37 - "Agents Skills"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 38 - "Agents Skills"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 39 - "Backend Scripts"
Cohesion: 0.15
Nodes (9): captured, createFakeDriver(), __dirname, failures, fakeInt(), FIXTURE_FILE, PACKAGE_ROOT, rejectPatterns (+1 more)

### Community 40 - "Design Agents"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 41 - "Agents Skills"
Cohesion: 0.22
Nodes (7): _contrast_ratio(), _derive_dark_palette(), WCAG contrast ratio for two hex colors, or None if either is invalid., Keep product brand tokens while deriving accessible dark surfaces., Pick the highest-ranked palette matching the resolved mode. Only the dark case…, _select_palette_for_mode(), TestPaletteSelection

### Community 42 - "Test Agents"
Cohesion: 0.24
Nodes (4): split_values(), style_identities(), TestGeneratedCatalogContract, TestStyleIdentityContract

### Community 43 - "Backend Scripts"
Cohesion: 0.17
Nodes (11): BASE_TIME, __dirname, OUTPUT_FILE, PACKAGE_ROOT, payload, toRawHex(), totalTransfers, transfer() (+3 more)

### Community 44 - "Generate Logo"
Cohesion: 0.23
Nodes (11): enhance_prompt(), generate_batch(), generate_logo(), load_env(), main(), Enhance the logo prompt with style and industry modifiers, Generate a logo using Gemini models with image generation Args: aspect_ratio:…, Generate multiple logo variants with different styles (+3 more)

### Community 45 - "Agents Skills"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 46 - "Design Agents"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 47 - "Add Agents"
Cohesion: 0.20
Nodes (7): main(), Handle shadcn/ui component installation., ShadcnInstaller, Tests for shadcn_add.py, Test adding components that are already installed., Test listing installed components when they exist., Test getting installed components without config.

### Community 48 - "Shadcn Add"
Cohesion: 0.21
Nodes (6): Add all available shadcn/ui components. Args: overwrite: If True, overwrite…, List installed components. Returns: Tuple of (success, message with component…, Check if shadcn is initialized in project. Returns: True if components.json…, Get list of already installed components. Returns: List of installed component…, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components. Args: components: List of component names to add…

### Community 49 - "Config Agents"
Cohesion: 0.20
Nodes (6): Generate configuration file content. Returns: Configuration file as string, Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config. Validates each plugin name against a strict…, Add indentation to JSON string., Write configuration to file. Returns: Tuple of (success, message)

### Community 50 - "Brand Agents"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 51 - "Tokens Agents"
Cohesion: 0.18
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 52 - "Design Agents"
Cohesion: 0.18
Nodes (11): fast, normal, slow, $type, $value, $type, $value, primitive (+3 more)

### Community 53 - "Test Add"
Cohesion: 0.18
Nodes (6): Test adding components with overwrite flag., Test successful component addition., Test component addition with subprocess error., Test component addition when npx is not found., Test successful addition of all components., patch

### Community 54 - "Test Config"
Cohesion: 0.22
Nodes (8): Tests for tailwind_config_gen.py, Reduce a generated TS/JS config to a bare assignable object so it can be handed…, Regression guard for the missing-comma bug between the ``theme`` block and…, The property preceding ``plugins`` must end with a comma (pure-Python check, so…, The emitted config parses as valid JS via ``node --check``., _strip_to_object(), TestGeneratedConfigIsValidJs, parametrize

### Community 55 - "Agents Skills"
Cohesion: 0.20
Nodes (7): format_markdown(), generate_design_system(), Format design system as markdown., Main entry point for design system generation. Args: query: Search query (e.g.,…, format_output(), Format results for Claude consumption (token-optimized), TestPersistence

### Community 56 - "Agents Skills"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 57 - "Design Agents"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 58 - "Config Agents"
Cohesion: 0.22
Nodes (6): Path, Initialize generator. Args: typescript: If True, generate .ts config, else .js…, Determine default output path., Create base configuration structure., Get default content paths for framework., Any

### Community 59 - "Agents Skills"
Cohesion: 0.27
Nodes (6): apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), Return deterministic mutations and an audit trail; never execute data., Parse the canonical condition -> action-array representation., _validate_action()

### Community 60 - "Test Layout"
Cohesion: 0.22
Nodes (3): read_rows(), TestTextLayoutDataContracts, TestTextLayoutRetrieval

### Community 61 - "Brand Agents"
Cohesion: 0.33
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 62 - "Test Agents"
Cohesion: 0.28
Nodes (8): Path, Regression tests for validate-tokens.cjs. The validator used to skip any line…, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives., _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), CompletedProcess

### Community 63 - "Backend Package"
Cohesion: 0.22
Nodes (8): description, engines, node, main, name, private, type, version

### Community 64 - "Backend Package"
Cohesion: 0.22
Nodes (9): scripts, dev, seed:exchanges, seed:fixtures, smoke, smoke:graph, smoke:trace, start (+1 more)

### Community 65 - "Design Agents"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 66 - "Design Agents"
Cohesion: 0.29
Nodes (8): $type, $value, $type, $value, radius, default, full, default

### Community 67 - "Agents Skills"
Cohesion: 0.25
Nodes (8): _exact_row_identity(), Suggest complete public identities so a retry can bypass score thresholds., Return non-empty public identities from ordinary and alias fields., Resolve an explicit style identity without opening generic variant ranking., Return one row whose stable public identity exactly matches the query., _row_identities(), _style_identity(), _suggest_identities()

### Community 68 - "Agents Skills"
Cohesion: 0.25
Nodes (8): ansi_ljust(), format_ascii_box(), hex_to_ansi(), Convert hex color to ANSI True Color swatch (██) with fallback., Like str.ljust but accounts for zero-width ANSI escape sequences., Create a Unicode section separator: ├─── NAME ───...┤, Format design system as Unicode box with ANSI color swatches., section_header()

### Community 69 - "Test Mode"
Cohesion: 0.43
Nodes (3): _filter_anti_patterns_for_mode(), Drop "avoid dark mode" advice once dark mode is the resolved answer., TestAntiPatternGating

### Community 70 - "Design Agents"
Cohesion: 0.47
Nodes (6): sm, shadow, sm, sm, $type, $value

### Community 72 - "Design Agents"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 73 - "Design Agents"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 74 - "Design Agents"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 75 - "Design Agents"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 76 - "Design Agents"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 77 - "Design Agents"
Cohesion: 0.67
Nodes (4): $type, $value, md, md

### Community 78 - "Design Agents"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 81 - "Design Agents"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 82 - "Design Agents"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 83 - "Design Agents"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 84 - "Design Agents"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 85 - "Design Agents"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 86 - "Design Agents"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

## Knowledge Gaps
- **249 isolated node(s):** `fs`, `path`, `fs`, `path`, `fs` (+244 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `search()` connect `Test Agents` to `Test Agents`, `Agents Skills`, `Agents Skills`, `Data Agents`, `Max Agents`, `Agents Skills`, `Agents Skills`, `Agents Skills`, `Test Layout`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `BM25` connect `Cip Agents` to `Agents Skills`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `primitive` connect `Design Agents` to `Design Agents`, `Design Agents`, `Design Agents`, `Design Agents`, `Design Agents`, `Design Agents`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `DesignSystemGenerator` (e.g. with `TestReasoningMatch` and `TestReasoningContract`) actually correct?**
  _`DesignSystemGenerator` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `fs`, `path`, `fs` to the rest of the system?**
  _249 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Src` be split into smaller, more focused modules?**
  _Cohesion score 0.06351236146632566 - nodes in this community are weakly interconnected._