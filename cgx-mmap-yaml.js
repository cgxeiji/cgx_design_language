/**
 * CGx Mindmap — YAML Serializer / Deserializer
 * Handles the specific mmap YAML schema without external dependencies.
 *
 * Schema:
 *   mmap:
 *     name: <string>
 *     entries:
 *       - uid: <string>
 *         text: <string>
 *         position:
 *           x: <number>
 *           y: <number>
 *           w: <number>
 *           h: <number>
 *         parent: <string|"">
 */

/* exported mmapToYAML, mmapFromYAML */

'use strict';

/**
 * Serialize a mindmap state object to a YAML string.
 * @param {{ name: string, entries: Array<{uid:string,text:string,x:number,y:number,w:number,h:number,parent:string}> }} state
 * @returns {string}
 */
function mmapToYAML(state) {
    const lines = [];
    lines.push('mmap:');
    lines.push(`  name: ${yamlScalar(state.name)}`);
    lines.push('  entries:');

    state.entries.forEach(e => {
        lines.push(`    - uid: ${yamlScalar(e.uid)}`);
        lines.push(`      text: ${yamlScalar(e.text)}`);
        lines.push('      position:');
        lines.push(`        x: ${e.x}`);
        lines.push(`        y: ${e.y}`);
        lines.push(`        w: ${e.w}`);
        lines.push(`        h: ${e.h}`);
        lines.push(`      parent: ${e.parent ? yamlScalar(e.parent) : "''"}`);
    });

    return lines.join('\n') + '\n';
}

/**
 * Deserialize a YAML string into a mindmap state object.
 * @param {string} yamlStr
 * @returns {{ name: string, entries: Array<{uid:string,text:string,x:number,y:number,w:number,h:number,parent:string}> }}
 */
function mmapFromYAML(yamlStr) {
    const state = { name: 'Untitled', entries: [] };

    const lines = yamlStr.split('\n');
    let i = 0;

    // Skip until 'mmap:'
    while (i < lines.length && lines[i].trim() !== 'mmap:') i++;
    i++; // skip 'mmap:'

    // Parse name
    while (i < lines.length) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('name:')) {
            state.name = yamlUnquote(trimmed.slice(5).trim());
            i++;
            break;
        }
        i++;
    }

    // Skip to 'entries:'
    while (i < lines.length && lines[i].trim() !== 'entries:') i++;
    i++; // skip 'entries:'

    // Parse entries
    while (i < lines.length) {
        const trimmed = lines[i].trim();
        if (trimmed === '' || (!trimmed.startsWith('-') && !trimmed.startsWith('uid:') &&
            !trimmed.startsWith('text:') && !trimmed.startsWith('position:') &&
            !trimmed.startsWith('x:') && !trimmed.startsWith('y:') &&
            !trimmed.startsWith('w:') && !trimmed.startsWith('h:') &&
            !trimmed.startsWith('parent:'))) {
            // Could be empty line or end of entries — skip empty, break on unrecognised
            if (trimmed === '') { i++; continue; }
            break;
        }

        if (trimmed.startsWith('- uid:') || trimmed.startsWith('-  uid:')) {
            const entry = {
                uid: yamlUnquote(trimmed.replace(/^-\s*uid:\s*/, '')),
                text: '', x: 0, y: 0, w: 160, h: 80, parent: ''
            };
            i++;

            // Read remaining fields for this entry
            while (i < lines.length) {
                const t = lines[i].trim();
                if (t === '' || t.startsWith('- uid:') || t.startsWith('-  uid:')) break;

                if (t.startsWith('text:')) {
                    entry.text = yamlUnquote(t.slice(5).trim());
                } else if (t.startsWith('x:')) {
                    entry.x = parseFloat(t.slice(2).trim()) || 0;
                } else if (t.startsWith('y:')) {
                    entry.y = parseFloat(t.slice(2).trim()) || 0;
                } else if (t.startsWith('w:')) {
                    entry.w = parseFloat(t.slice(2).trim()) || 160;
                } else if (t.startsWith('h:')) {
                    entry.h = parseFloat(t.slice(2).trim()) || 80;
                } else if (t.startsWith('parent:')) {
                    const raw = t.slice(7).trim();
                    entry.parent = (raw === "''" || raw === '""' || raw === '') ? '' : yamlUnquote(raw);
                }
                i++;
            }

            state.entries.push(entry);
        } else {
            i++;
        }
    }

    return state;
}


/* ---- Helpers ---- */

/**
 * Quote a string for safe YAML output. Uses single quotes if the value
 * contains special characters; otherwise emits it plain.
 */
function yamlScalar(val) {
    const s = String(val);
    if (s === '') return "''";
    // If it looks safe as a plain scalar, emit unquoted
    if (/^[A-Za-z0-9_.\- /]+$/.test(s) && !/^\s/.test(s) && !/\s$/.test(s)) {
        return s;
    }
    // Otherwise single-quote, escaping internal single quotes
    return "'" + s.replace(/'/g, "''") + "'";
}

/**
 * Remove surrounding quotes from a YAML scalar value.
 */
function yamlUnquote(val) {
    let s = val.trim();
    if ((s.startsWith("'") && s.endsWith("'")) ||
        (s.startsWith('"') && s.endsWith('"'))) {
        s = s.slice(1, -1);
    }
    // Unescape doubled single quotes
    return s.replace(/''/g, "'");
}
