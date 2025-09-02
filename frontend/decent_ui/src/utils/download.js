function jsonMaker(obj_input, selected) {
    // Filter only the objects whose id is included in `selected`
    let rel_ids = obj_input.filter(item => selected.includes(item.id));
    
    // Filter only the objects whose id is included in `selected`
    return JSON.stringify(rel_ids, null, 2);
}

/**
 * handleDownload
 * 
 * Utility to trigger a download of selected JSON data as a file. 
 * Steps:
 * 1. Calls jsonMake to filter and stringfy the data. 
 * 2. Creates a blob with JSON MIME type.
 * 3. Dynamically creates a temporary <a> element with download attribute.
 * 4. Simulates a click to trigger download. 
 * 5. Cleans up by removing the temporary element. 
 * 
 * Params: 
 * - file_name: string, base name for the downloaded file
 * - content: array of objects to filer and export 
 * - selected: array of IDs specifying which objects to include. 
 * 
 * Reference:
 * https://medium.com/@kbhattacharya75/download-text-file-from-a-website-using-only-javascript-react-958ce41be593
 */  
export function handleDownload(file_name, content, selected) {
    const text = jsonMaker(content, selected);
    
    
    // Create blob with application/json type
    const file = new Blob([text], {type: 'application/json'});

    // Create hidden anchor tag
    const element = document.createElement('a');
    element.href = URL.createObjectURL(file);
    element.download = file_name + '.json';

    // Append, click, and remove to trigger download
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};