import {expect} from 'chai'

describe('snake', () => {
  it('a test for testing', () => {
    const given = 'foo'
    const result = given + '-bar'
    expect(result).to.equal('foo-bar')
  })
})