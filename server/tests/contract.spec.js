"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const contract_1 = require("../src/contract");
const utils_1 = require("../src/utils");
const ecdsa = require("elliptic");
const ec = new ecdsa.ec('secp256k1');
mocha_1.describe('Contract test', () => __awaiter(this, void 0, void 0, function* () {
    mocha_1.it('$addContractToPool. Expect ok.', () => __awaiter(this, void 0, void 0, function* () {
        yield contract_1.$cleanContractPool();
        const key = yield ec.genKeyPair();
        const pubKey = yield key.getPublic().encode('hex');
        const contract1 = new contract_1.Contract({
            claimant: pubKey,
            amount: 20,
            price: 900,
            expDate: utils_1.getCurrentTimestamp() + 1000
        });
        const contract2 = new contract_1.Contract({
            claimant: pubKey,
            amount: 10,
            price: 890,
            expDate: utils_1.getCurrentTimestamp() + 1000
        });
        yield contract_1.$addContractToPool(contract1);
        yield contract_1.$addContractToPool(contract2);
        const ctPool = yield contract_1.$contractPool();
        chai_1.expect(ctPool).to.be.an('array');
        chai_1.expect(ctPool).to.deep.include(contract1);
        chai_1.expect(ctPool).to.deep.include(contract2);
    }));
}));
//# sourceMappingURL=contract.spec.js.map