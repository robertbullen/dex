import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';

export function TextEditor({ mode, value }: { mode: string; value: string }) {
	return (
		<AceEditor
			className="w-100"
			mode={mode}
			readOnly={true}
			value={value}
			setOptions={{ useWorker: false }}
		/>
	);
}
