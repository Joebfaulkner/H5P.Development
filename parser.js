class Parser
{
    /**
     * @constructor
     * @param {String} parserType
     * 
     */
    constructor(parserType)
    {
        this.parserType = parserType;
    }

    /**
     * 
     * @param {Array} tokens 
     * @returns {int} indexOfError
     */
    parse(tokens) 
    {
        const seperators = [' ', 'Φ', '(', ')', '{', '}', '[', ']', '.', ';'];
        const opperators = ['=' , '+' , '-' , '/' , '%' , '+=' , '-=' , '/=' , '*=' , '%=' , '==' , '<' , '>' , '<=' , '>=' , '++' , '--'];
        const keywords = ['int' , 'double' , 'float' , 'long' , 'String' , 'char' , 'byte' , 'for' , 'while' , 'if' , 'else' , 'class' , 'final' , 'protected' , 'public' , 'private' , 'static' , 'void' , 'return' , 'switch' , 'case' , 'this' , 'boolean' , 'main' , 'args', 'import', 'extends'];
        const variableTypes = ['int' , 'double' , 'float' , 'long' , 'String' , 'char' , 'byte', 'boolean']; // Subsection of keywords
        const numberVariables = ['int' , 'double' , 'float' , 'long' , 'byte'];
        //Need to figure out how to work on scoping later. Maybe an array of arrays that can append a new one on as a new scope is created?
        const variablesDeclared = []; // This is an array to store all declared variables.
        let index = 0;
        while(index <= tokens.length)
        {
            let tokenHolder = tokens[index]; // A variable to hold the starting token of a statement.
            if(keyword.indexOf(tokenHolder.tokenType) !== -1)
            {
                if(variableTypes.indexOf(tokens[index].tokenName) !== -1) // If it starts with a variable type
                {
                    index++;
                    if(!(variablesDeclared.indexOf(tokens[index].tokenName) !== -1)) // If it's not a previously declared identifier
                    {
                        index++;
                        if(tokens[index].tokenName === '=')
                        {
                            index++;
                            if(numberVariable.indexOf(tokenHolder.tokenName) != -1) // If there is a number type of variable being declared
                            {
                                if(!isNaN(tokens[index]))
                                {

                                }
                                else
                                {
                                    return -1;
                                }
                            }
                            else if(tokenHolder.tokenName = 'String')
                            {
                                if(tokenHolder.tokenName.charAt(0) === '"' && tokenHolder.tokenName.charAt(tokenHolder.tokenName.length-1) === '"')
                                {
                                    
                                }
                            }
                            else if(tokenHolder.tokenName === 'boolean')
                            {

                            }
                        }
                    }
                }
            }
            else if((tokenHolder.tokenType === 'identifier' && !(variablesDeclared.indexOf(tokens[index].tokenType) !== -1)))
            {
                //If the statement starts with a previously declared identifier
            }
            index++;
        }
    }
}