/**
 * Extracts array data from a form submission body.
 * @param {object} data - The request body from the form.
 * @param {string[]} fieldNames - An array of field names to extract.
 * @returns {object[]} An array of objects, where each object represents a row of data.
 */
function extractArrayData(data, fieldNames) {
    const result = [];
    const length = Math.max(...fieldNames.map(field => 
        Array.isArray(data[field]) ? data[field].length : (data[field] ? 1 : 0)
    ));
    
    for (let i = 0; i < length; i++) {
        const item = {};
        fieldNames.forEach(field => {
            if (Array.isArray(data[field]) && data[field][i]) {
                item[field.replace(/[]$/, '')] = data[field][i];
            } else if (!Array.isArray(data[field]) && data[field] && i === 0) {
                item[field.replace(/[]$/, '')] = data[field];
            }
        });
        
        // Only add item if it has at least one non-empty field
        if (Object.values(item).some(value => value && value.toString().trim() !== '')) {
            result.push(item);
        }
    }
    
    return result;
}

/**
 * Gets the most recent qualification from a list of qualifications.
 * @param {object} data - The request body containing qualification data.
 * @returns {object | null} The latest qualification object or null if none are found.
 */
function getLatestQualification(data) {
    const qualifications = extractArrayData(data, ['institution', 'fromYear', 'toYear', 'qualification']);
    if (qualifications.length === 0) return null;
    
    return qualifications.reduce((latest, current) => {
        const currentYear = parseInt(current.toYear) || 0;
        const latestYear = parseInt(latest.toYear) || 0;
        return currentYear > latestYear ? current : latest;
    });
}

module.exports = {
    extractArrayData,
    getLatestQualification
};
