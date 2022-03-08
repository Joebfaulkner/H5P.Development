class Token
{
    /**
     * @constructor
     * @param {String} tokenName 
     * @param {String} tokenType 
     */
    constructor(tokenName, tokenType)
    {
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
            console.log("hit");
            if(input.charAt(currentSpot) === (' ' | 'Φ' | '(' | ')' | '{' | '}' | '[' | '.')) //Check the current spot for seperators
            {
                let tokenName = input.slice(previousSpot, currentSpot -1);
                if(tokenName === ('=' | '+' | '-' | '/' | '%' | '+=' | '-=' | '/=' | '*=' | '%=' | '==' | '<' | '>' | '<=' | '>=')) //Check for opperators
                {
                    tokens.push(Token(tokenName, "opperator"));
                }
                else if(tokenName === ('int' | 'double' | 'float' | 'long' | 'String' | 'char' | 'byte' | 'for' | 'while' | 'if' | 'else' | 'class' | 'final' | 'protected' | 'public' | 'private' | 'static' | 'void' | 'return' | 'switch' | 'case' | 'this' | 'boolean'| 'main')) //Check for keywords
                {
                    tokens.push(Token(tokenName, "keyword"));
                }
                else if((tokenName === ('true' | 'false')) || (!isNaN(tokenName)) || (input.charAt(previousSpot + 1) === '"' && input.charAt(currentSpot-1) === '"')) // Check for literals
                {
                    tokens.push(Token(tokenName, "literal"));
                }
                else if((input.charAt(previousSpot+1) === '/' && input.charAt(previousSpot+2) === '/' && input.charAt(currentSpot) === 'Φ') || (input.charAt(previousSpot+1) === '/' && input.charAt(previousSpot+2) === '*' && charAt(currentSpot) === 'Φ')) // Check for commments
                {
                    tokens.push(Token(tokenName, "comment"));
                }
                else // If it's none of that it should be an identifier
                {
                    tokens.push(Token(tokenName, "identifier"));
                }
                
                if(tokenName != ('Φ' | ' '))
                {
                    tokenName = input.slice(currentSpot, currentSpot);
                    tokens.push(tokenName, "seperator");
                }
                previousSpot = currentSpot;
                
                
            }
            else
            {
                currentSpot = currentSpot + 1;
            }
        }
        return tokens;
    }
}