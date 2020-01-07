import { Selector } from 'testcafe';
import fs from 'fs';
// const initializationScript = fs.readFileSync('h5-ad-wrapper.umd.js').toString();

fixture `Getting Started`
    .page `http://localhost:8000/testcafe`
    .clientScripts('./h5-ad-wrapper.umd.js');

test('My first test', async t => {
    await t
        .click('#setup-provider')
        .click('#show-ad')
        // .expect(Selector('#loaded').innerText).eql('loaded')
})
    .clientScripts({ module: 'async' });
