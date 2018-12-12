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
const flow_1 = require("../src/flow");
const utils_1 = require("../src/utils");
const CryptoJS = require("crypto-js");
const ecdsa = require("elliptic");
const ec = new ecdsa.ec('secp256k1');
mocha_1.describe('Flow test', () => __awaiter(this, void 0, void 0, function* () {
    const sign = (privateKey, id) => __awaiter(this, void 0, void 0, function* () {
        const key = ec.keyFromPrivate(privateKey, 'hex');
        return utils_1.toHexString(key.sign(id).toDER());
    });
    mocha_1.it('$addFlowToPool. Expect ok.', () => __awaiter(this, void 0, void 0, function* () {
        yield flow_1.$cleanFlowPool();
        const key = yield ec.genKeyPair();
        const pubKey = yield key.getPublic().encode('hex');
        const privKey = yield key.getPrivate().toString(16);
        const flowData1 = {
            id: '',
            timestamp: utils_1.getCurrentTimestamp(),
            generator: pubKey,
            amount: 20,
            claimId: 'someClaimId',
            signature: ''
        };
        const flowData2 = {
            id: '',
            timestamp: utils_1.getCurrentTimestamp(),
            generator: pubKey,
            amount: 20,
            claimId: 'someClaimId2',
            signature: ''
        };
        const flow1Hash = yield CryptoJS.SHA256(flowData1.timestamp + flowData1.generator + flowData1.amount + flowData1.claimId).toString();
        const flow2Hash = yield CryptoJS.SHA256(flowData2.timestamp + flowData2.generator + flowData2.amount + flowData2.claimId).toString();
        flowData1.id = flow1Hash;
        flowData2.id = flow2Hash;
        flowData1.signature = yield sign(privKey, flowData1.id);
        flowData2.signature = yield sign(privKey, flowData2.id);
        yield flow_1.$addToFlowPool(flowData1);
        yield flow_1.$addToFlowPool(flowData2);
        const fPool = yield flow_1.$flowPool();
        chai_1.expect(fPool).to.be.an('array');
        chai_1.expect(fPool).to.deep.include(flowData1);
        chai_1.expect(fPool).to.deep.include(flowData2);
    }));
}));
//# sourceMappingURL=flow.spec.js.map