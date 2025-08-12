function jsonMaker(obj_input, selected) {
    let rel_ids = obj_input.filter(item => selected.includes(item.id));
    
    return JSON.stringify(rel_ids, null, 2);
}

/* 
    modified version of 
    https://medium.com/@kbhattacharya75/download-text-file-from-a-website-using-only-javascript-react-958ce41be593
 */
export function handleDownload(file_name, content, selected) {
    const text = jsonMaker(content, selected);
    const element = document.createElement('a');
    const file = new Blob([text], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = file_name + '.json';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};