import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiKey: 'AIzaSyDmLnbkUd74K0tnoRCA8bOGF_TYkT7_l2A'})],
  model: 'googleai/gemini-2.0-flash',
});
