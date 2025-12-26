import { loader } from '@monaco-editor/react';

// Use a stable version that matches our Layout.astro configuration
const MONACO_VERSION = '0.52.0';
const CDN_BASE = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs`;

// Force the loader to use the CDN version. 
// This is CRITICAL to avoid the NetworkError caused by Vite trying to bundle local workers.
loader.config({
  paths: {
    vs: CDN_BASE
  }
});

export const ensureKQL = (monaco: any) => {
  if (!monaco) return;

  const languages = monaco.languages.getLanguages();
  const isRegistered = languages.some((l: any) => l.id === 'kql');

  if (!isRegistered) {
    monaco.languages.register({ id: 'kql' });
  }

  // Always re-register the provider and theme to ensure they stick across page swaps
  monaco.languages.setMonarchTokensProvider('kql', {
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/^\s*\..*$/, 'management'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\b(AuthenticationEvents|Employees|SigninLogs|SecurityEvent|Heartbeat|Perf|Event|Syslog|CommonSecurityLog|AzureActivity|AzureDiagnostics|VMConnection|ServiceMapComputer_CL|ServiceMapProcess_CL|W3CIISLog|AppServiceHTTPLogs|FunctionAppLogs|ContainerLog|KubeEvents|KubePodInventory)\b/, 'table'],
        [/\b[A-Z][a-zA-Z0-9_]*(?=\s*\||\s*$)/, 'table'],
        [/\b(take|project|where|summarize|extend|join|union|sort|order|top|sample|distinct|render|search|parse|evaluate|invoke|print|datatable|range|materialize|serialize|as|into|fork|partition|facet|mv-expand|mv-apply|getschema|externaldata)\b/, 'query-operator'],
        [/\b(ago|now|datetime|timespan|todatetime|tostring|toint|todouble|tobool|totimespan|bin|floor|ceiling|round|abs|sqrt|pow|log|exp|sin|cos|tan|asin|acos|atan|strlen|substring|tolower|toupper|trim|split|replace|strcat|indexof|countof|extract|parse_json|todynamic|bag_keys|array_length|array_index_of|array_slice|hash|hash_sha1|hash_sha256|hash_md5|base64_encode_tostring|base64_decode_tostring|url_encode|url_decode|count|sum|avg|min|max|stdev|variance|percentile|percentiles|dcount|dcountif|countif|sumif|avgif|minif|maxif|arg_max|arg_min|make_list|make_set|make_bag|pack|pack_array|pack_all|unpack|bag_unpack|treepath|format_datetime|format_timespan|dayofweek|dayofmonth|dayofyear|weekofyear|monthofyear|getyear|getmonth|startofday|startofweek|startofmonth|startofyear|endofday|endofweek|endofmonth|endofyear|isempty|isnull|isnotnull|isnan|isfinite|isinf|case|iff|coalesce|iif)\b/, 'function'],
        [/\b(kind|inner|outer|left|right|anti|semi|innerunique|leftouter|rightouter|fullouter|leftanti|rightanti|leftsemi|rightsemi)\b/, 'keyword'],
        [/\b(let|on|by|asc|desc|nulls|first|last|granny|hint\.strategy|hint\.num_partitions|hint\.shufflekey|hint\.spread|with|step|from|to|in|has|contains|startswith|endswith|matches|regex|between|and|or|not|true|false|null|dynamic|real|int|long|string|bool|decimal|guid)\b/, 'keyword'],
        [/\b[a-z_][a-zA-Z0-9_]*\b(?=\s*[,=<>!]|\s*\))/, 'field'],
        [/\b[a-z_][a-zA-Z0-9_]*\b(?=\s*==|\s*!=|\s*<=|\s*>=|\s*<|\s*>)/, 'field'],
        [/==|!=|<=|>=|<>/, 'operator'],
        [/=(?!=)/, 'assignment'],
        [/[<>]/, 'operator'],
        [/[+\-*\/]/, 'operator'],
        [/\|/, 'pipe'],
        [/\b\d+\.?\d*([eE][-+]?\d+)?\b/, 'number'],
        [/\b0x[0-9a-fA-F]+\b/, 'number'],
        [/[()[\]{}]/, 'delimiter'],
        [/[,;]/, 'delimiter'],
        [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
        [/\s+/, ''],
      ],
      comment: [
        [/[^\/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/\*]/, 'comment'],
      ],
    },
  });

  monaco.editor.defineTheme('kql-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'table', foreground: 'c084fc' },
      { token: 'query-operator', foreground: 'fbbf24' },
      { token: 'function', foreground: '22d3ee' },
      { token: 'keyword', foreground: '3b82f6' },
      { token: 'field', foreground: 'e2e8f0' },
      { token: 'management', foreground: '22d3ee' },
      { token: 'string', foreground: 'a3e635' },
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
      { token: 'operator', foreground: '94a3b8' },
      { token: 'assignment', foreground: '94a3b8' },
      { token: 'pipe', foreground: 'fbbf24' },
      { token: 'number', foreground: 'f472b6' },
      { token: 'delimiter', foreground: '94a3b8' },
      { token: 'identifier', foreground: 'e2e8f0' },
    ],
    colors: {
      'editor.background': '#0B0C15',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#15192b',
      'editorCursor.foreground': '#a78bfa',
      'editor.selectionBackground': '#232942',
    },
  });
};

export const initMonaco = async () => {
  const monaco = await loader.init();
  ensureKQL(monaco);
  return monaco;
};
