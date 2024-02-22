import { lowercaseTags } from './data/lowercaseTags.js';
import { excluded } from './data/excludeTags.js';

export const getSuggest = async (prompt) => {
    let queryArray = prompt.split(' ');
    let lowercaseArray = queryArray.map(word => word.toLowerCase());
    let suggestions = [];

    lowercaseArray = lowercaseArray.filter(word => !excluded.includes(word.toLowerCase()));

    lowercaseArray.forEach(word => {
        if (lowercaseTags.includes(word) && !suggestions.includes(word.toLowerCase())) {
            suggestions.push(word);
        }
    });

    return suggestions;
}
