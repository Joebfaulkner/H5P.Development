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
        const seperators = [' ', 'Φ', '(', ')', '{', '}', '[', ']', '.', ';'];
        const opperators = ['=' , '+' , '-' , '/' , '%' , '+=' , '-=' , '/=' , '*=' , '%=' , '==' , '<' , '>' , '<=' , '>=' , '++' , '--']
        const keywords = ['int' , 'double' , 'float' , 'long' , 'String' , 'char' , 'byte' , 'for' , 'while' , 'if' , 'else' , 'class' , 'final' , 'protected' , 'public' , 'private' , 'static' , 'void' , 'return' , 'switch' , 'case' , 'this' , 'boolean' , 'main' , 'args', 'import', 'extends']
        const tokens = [];
        let currentSpot = 0;
        let previousSpot = 0;
        while(currentSpot <= input.length)
        {
            if(input.charAt(currentSpot-1) === "/") //Check for comments
            {
                if(input.charAt(currentSpot) === "/")
                {
                    previousSpot = currentSpot - 1;
                    currentSpot++;
                    while(input.charAt(currentSpot) !== "Φ" && currentSpot <= input.length)
                    {
                        currentSpot++;
                    }
                    let tokenName = input.slice(previousSpot, currentSpot);
                    tokens.push(new Token(tokenName, "commment"));
                    previousSpot = currentSpot;
                }
                else if(input.charAt(currentSpot) === "*")
                {
                    previousSpot = currentSpot;
                    currentSpot++;
                    while(input.charAt(currentSpot) != "/" || input.charAt(currentSpot-1) != "*")
                    {
                        currentSpot++;
                    }
                    let tokenName = input.slice(previousSpot-1, currentSpot+1);
                    tokens.push(new Token(tokenName, "commment"));
                    previousSpot = currentSpot;
                }
            }
            else if(input.charAt(currentSpot) === '"') //Check for strings
            {
                previousSpot = currentSpot;
                currentSpot++;
                while(input.charAt(currentSpot) !== '"')
                {
                    currentSpot++;
                }
                let tokenName = input.slice(previousSpot, currentSpot + 1);
                tokens.push(new Token(tokenName, "literal"));
                previousSpot = currentSpot;
            }
            else if(opperators.indexOf(input.charAt(currentSpot)) !== -1 && !(seperators.indexOf(input.charAt(currentSpot-1)) !== -1))
            {
                let tokenName = input.slice(previousSpot + 1, currentSpot);
                if(tokenName != '')
                {
                    tokens.push(new Token(tokenName, "identifier"));
                    if(opperators.indexOf(input.charAt(currentSpot) + input.charAt(currentSpot+1)) !== -1)
                    {
                        tokenName = input.slice(currentSpot, currentSpot+2)
                        tokens.push(new Token(tokenName, "opperator"));
                    }
                    else
                    {
                        tokenName = input.charAt(currentSpot)
                        tokens.push(new Token(tokenName, "opperator"));
                    }
                    previousSpot = currentSpot;
                }
            }
            else if(seperators.indexOf(input.charAt(currentSpot)) !== -1 || currentSpot == input.length) //Check the current spot for seperators or if we've reached the end of the input
            {
                let tokenName = input.slice(previousSpot + 1, currentSpot);
                
                if(previousSpot === 0)
                {
                    tokenName = input.slice(previousSpot, currentSpot);
                }
                if(opperators.indexOf(tokenName) !== -1) //Check for opperators
                {
                    tokens.push(new Token(tokenName, "opperator"));
                }
                else if(keywords.indexOf(tokenName) !== -1) //Check for keywords
                {
                    tokens.push(new Token(tokenName, "keyword"));
                }
                else if((tokenName === 'true' || tokenName === 'false') || (!isNaN(tokenName) && tokenName != '')/* || (input.charAt(previousSpot + 1) === '"' && input.charAt(currentSpot-1) === '"')*/) // Check for literals
                {
                    tokens.push(new Token(tokenName, "literal"));
                }
                else if(tokenName !== '') // If it's none of that it should be an identifier
                {
                    if(tokenName.slice(tokenName.length - 2, tokenName.length) === '++' || tokenName.slice(tokenName.length - 2, tokenName.length) === '--') // Cover instances such as x++ or x--
                    {
                        tokens.push(new Token(tokenName.slice(0, tokenName.length -2), "identifier"));
                        tokens.push(new Token(tokenName.slice(tokenName.length-2, tokenName.length), "opperator"));
                    }
                    else
                    {
                        tokens.push(new Token(tokenName, "identifier"));
                    }
                    
                }
                tokenName = input.charAt(currentSpot);
                if(tokenName !== ' ' && tokenName !== 'Φ' && tokenName !== '')
                {
                    tokens.push(new Token(tokenName, "seperator"));
                }
                previousSpot = currentSpot;
                
                
            }
            currentSpot = currentSpot + 1;
        }
        return tokens;
    }
}