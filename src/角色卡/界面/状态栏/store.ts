import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../schema';

export const useDataStore = defineMvuDataStore(Schema, { type: 'chat' });
