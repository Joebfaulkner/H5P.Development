class Token
{
    /**
     * @constructor
     * @param {String} tokenName 
     * @param {String} tokenType 
     */
    constructor(tokenName, tokenType)
    {
        console.log("tokenName = " + tokenName);
        console.log("tokenType = " + tokenType);
        this.tokenName = tokenName;
        this.tokenType = tokenType;
    }

    static tokenization(input)
    {

        const tokens = [];
        let currentSpot = 0;
        let previousSpot = 0;
        while(currentSpot != input.length)
        {
            if(input.charAt(currentSpot) === (' ' || 'Φ' || '(' || ')' || '{' || '}' || '[' || ']'|| '.')) //Check the current spot for seperators
            {
                console.log("this one! " + input.charAt(currentSpot));
                let tokenName = input.slice(previousSpot, currentSpot);
                if(tokenName === ('=' || '+' || '-' || '/' || '%' || '+=' || '-=' || '/=' || '*=' || '%=' || '==' || '<' || '>' || '<=' || '>=')) //Check for opperators
                {
                    tokens.push(new Token(tokenName, "opperator"));
                }
                else if(tokenName === ('int' || 'double' || 'float' || 'long' || 'String' || 'char' || 'byte' || 'for' || 'while' || 'if' || 'else' || 'class' || 'final' || 'protected' || 'public' || 'private' || 'static' || 'void' || 'return' || 'switch' || 'case' || 'this' || 'boolean'|| 'main')) //Check for keywords
                {
                    tokens.push(new Token(tokenName, "keyword"));
                }
                else if((tokenName === ('true' || 'false')) || (!isNaN(tokenName)) || (input.charAt(previousSpot + 1) === '"' && input.charAt(currentSpot-1) === '"')) // Check for literals
                {
                    tokens.push(new Token(tokenName, "literal"));
                }
                else if((input.charAt(previousSpot+1) === '/' && input.charAt(previousSpot+2) === '/' && input.charAt(currentSpot) === 'Φ') || (input.charAt(previousSpot+1) === '/' && input.charAt(previousSpot+2) === '*' && charAt(currentSpot) === 'Φ')) // Check for commments
                {
                    tokens.push(new Token(tokenName, "comment"));
                }
                else // If it's none of that it should be an identifier
                {
                    tokens.push(new Token(tokenName, "identifier"));
                }
                
                if(tokenName !== ' ' && tokenName !== 'Φ')
                {
                    tokenName = input.slice(currentSpot, currentSpot);
                    tokens.push(new Token(tokenName, "seperator"));
                }
                previousSpot = currentSpot;
                
                
            }
            currentSpot = currentSpot + 1;
        }
        return tokens;
    }
}