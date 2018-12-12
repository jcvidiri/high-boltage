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
const contract_1 = require("../src/contract");
const blockchain_1 = require("../src/blockchain");
const utils_1 = require("../src/utils");
const CryptoJS = require("crypto-js");
const ecdsa = require("elliptic");
const ec = new ecdsa.ec('secp256k1');
mocha_1.describe('Mint test', () => __awaiter(this, void 0, void 0, function* () {
    const sign = (privateKey, id) => __awaiter(this, void 0, void 0, function* () {
        const key = ec.keyFromPrivate(privateKey, 'hex');
        return utils_1.toHexString(key.sign(id).toDER());
    });
    let flow1;
    let flow2;
    let contract1;
    let contract2;
    mocha_1.beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield flow_1.$cleanFlowPool();
        yield contract_1.$cleanContractPool();
        const key = yield ec.genKeyPair();
        const pubKey = yield key.getPublic().encode('hex');
        const privKey = yield key.getPrivate().toString(16);
        contract1 = new contract_1.Contract({
            claimant: pubKey,
            amount: 20,
            price: 900,
            expDate: utils_1.getCurrentTimestamp() + 1000
        });
        contract2 = new contract_1.Contract({
            claimant: pubKey,
            amount: 10,
            price: 890,
            expDate: utils_1.getCurrentTimestamp() + 1000
        });
        yield contract_1.$addContractToPool(contract1);
        yield contract_1.$addContractToPool(contract2);
        flow1 = {
            id: '',
            timestamp: utils_1.getCurrentTimestamp(),
            generator: pubKey,
            amount: 20,
            claimId: contract1.claimId,
            signature: ''
        };
        flow2 = {
            id: '',
            timestamp: utils_1.getCurrentTimestamp(),
            generator: pubKey,
            amount: 20,
            claimId: contract2.claimId,
            signature: ''
        };
        const flow1Hash = yield CryptoJS.SHA256(flow1.timestamp + flow1.generator + flow1.amount + flow1.claimId).toString();
        const flow2Hash = yield CryptoJS.SHA256(flow2.timestamp + flow2.generator + flow2.amount + flow2.claimId).toString();
        flow1.id = flow1Hash;
        flow2.id = flow2Hash;
        flow1.signature = yield sign(privKey, flow1.id);
        flow2.signature = yield sign(privKey, flow2.id);
        yield flow_1.$addToFlowPool(flow1);
        yield flow_1.$addToFlowPool(flow2);
    }));
    mocha_1.it('$addFlowsToClaims. Expect ok.', () => __awaiter(this, void 0, void 0, function* () {
        const flows = yield flow_1.$flowPool();
        const claims = yield contract_1.$contractPool();
        yield blockchain_1.$addFlowsToClaims({ flows, claims });
        chai_1.expect(claims).to.be.an('array');
        chai_1.expect(flows).to.be.an('array');
        chai_1.expect(claims[0].measurements).to.deep.include(flows[0]);
        chai_1.expect(claims[1].measurements).to.deep.include(flows[1]);
    }));
    mocha_1.it('$getResolvedContracts. Expect ok.', () => __awaiter(this, void 0, void 0, function* () {
        // const resolvedContracts = getResolvedContracts()
    }));
    mocha_1.it('$signContracts. Expect ok.', () => __awaiter(this, void 0, void 0, function* () {
        // await signContracts({contracts: resolvedContracts})
    }));
    mocha_1.it('$generateRawNextBlock. Expect ok.', () => __awaiter(this, void 0, void 0, function* () {
        // const rawBlock = generateRawNextBlock({contracts: resolvedContracts})
    }));
    mocha_1.it('$findBlock. Expect ok.', () => __awaiter(this, void 0, void 0, function* () {
        // const newBlock = await findBlock(rawBlock)
    }));
    mocha_1.it('$startMinting & $stopMinting. Expect ok.', () => __awaiter(this, void 0, void 0, function* () { }));
}));
//# sourceMappingURL=mint.spec.js.map