//import 'babel-polyfill';
const StarNotary = artifacts.require('StarNotary.sol')

let instance;
let accounts;
let owner;

contract('StarNotary', async (accs) => {
    accounts = accs;
    instance = await StarNotary.deployed();
    owner = accounts[0];
});
    
it('can Create a Star and get its name', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[2]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});
    
it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[2]
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether")
    await instance.createStar('awesome star', starId, {from: user1})
    await instance.putStarUpForSale(starId, starPrice, {from: user1})
    assert.equal(await instance.starsForSale.call(starId), starPrice)
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
  });


it('The token name and token symbol are added properly', async function() {
    assert.equal(await instance.name.call(), 'Star Notary Token');
    assert.equal(await instance.symbol.call(), 'SNT');
});

it('user can look up their Star based on the tokenId', async function() {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 10;
    await instance.createStar("User 1's original star", starId, {from: user1});
    assert.equal(await instance.lookUptokenIdToStarInfo.call(starId, {from: user1}), "User 1's original star");
});

it('2 users can exchange their stars', async function() {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId1 = 6;
    let starId2 = 7;
    await instance.createStar("User 1's original star", starId1, {from: user1});
    await instance.createStar("User 2's original star", starId2, {from: user2});
    await instance.putUpExchangeRequest(starId2, starId1, {from: user2});
    await instance.exchangeStars(starId1, starId2, {from: user1});
    assert.equal(await instance.ownerOf.call(starId1), user2);
    assert.equal(await instance.ownerOf.call(starId2), user1);
  });

it('Stars Tokens can be transferred from one address to another', async function() {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 8;
    await instance.createStar("User 1's original star", starId, {from: user1});
    assert.equal(await instance.ownerOf(starId), user1);
    await instance.starTransfer(user2, starId, {from: user1});
    assert.equal(await instance.ownerOf(starId), user2);
});