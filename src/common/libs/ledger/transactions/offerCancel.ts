import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class OfferCancel extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'OfferCancel';
        }

        this.fields = this.fields.concat(['OfferSequence']);
    }

    get OfferSequence(): number {
        return get(this, ['tx', 'OfferSequence']);
    }
}

/* Export ==================================================================== */
export default OfferCancel;
