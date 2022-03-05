var H5P = H5P || {};

H5P.Development = function ($, Question) 
{
    'use strict';

    // CSS Classes
    const SOLUTION_CONTAINER = 'h5p-essay-solution-container';
    const SOLUTION_TITLE = 'h5p-essay-solution-title';
    const SOLUTION_INTRODUCTION = 'h5p-essay-solution-introduction';
    const SOLUTION_SAMPLE = 'h5p-essay-solution-sample';
    const SOLUTION_SAMPLE_TEXT = 'h5p-essay-solution-sample-text';
    // The H5P feedback right now only expects true (green)/false (red) feedback, not neutral feedback
    const FEEDBACK_EMPTY = '<span class="h5p-essay-feedback-empty">...</span>';

    /**
    * @constructor
    * @param {Object} config - Config from semantics.json.
    * @param {string} contentId - ContentId.
    * @param {Object} [contentData] - contentData.
    */
    function Development(config, contentId, contentData) 
    {
       // Initialize
    if (!config) {
        return;
      }
  
      // Inheritance
      Question.call(this, 'essay');
  
      // Sanitize defaults
      this.params = Development.extend(
        {
          media: {},
          taskDescription: '',
          solution: {},
          overallFeedback: [],
          behaviour: {
            minimumLength: 0,
            inputFieldSize: 10,
            enableCheckButton: true,
            enableRetry: true,
            ignoreScoring: false,
            pointsHost: 1
          },
          checkAnswer: 'Check',
          submitAnswer: 'Submit',
          tryAgain: 'Retry',
          showSolution: 'Show solution',
          feedbackHeader: 'Feedback',
          solutionTitle: 'Sample solution',
          remainingChars: 'Remaining characters: @chars',
          notEnoughChars: 'You must enter at least @chars characters!',
          messageSave: 'saved',
          ariaYourResult: 'You got @score out of @total points',
          ariaNavigatedToSolution: 'Navigated to newly included sample solution after textarea.',
          ariaCheck: 'Check the answers.',
          ariaShowSolution: 'Show the solution. You will be provided with a sample solution.',
          ariaRetry: 'Retry the task. You can improve your previous answer if the author allowed that.'
        },
        config);
      this.contentId = contentId;
      this.extras = contentData;
  
      this.score = 0;
      this.internalShowSolutionsCall = false;
  
      // Sanitize HTML encoding
      this.params.placeholderText = this.htmlDecode(this.params.placeholderText || '');
  
      // Get previous state from content data
      if (typeof contentData !== 'undefined' && typeof contentData.previousState !== 'undefined') {
        this.previousState = contentData.previousState;
      }
  
      this.isAnswered = this.previousState && this.previousState.inputField && this.previousState.inputField !== '' || false;
      /*
       * this.params.behaviour.enableSolutionsButton and this.params.behaviour.enableRetry are used by
       * contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-8} and
       * {@link https://h5p.org/documentation/developers/contracts#guides-header-9}
       */
      this.params.behaviour.enableSolutionsButton = (typeof this.params.solution.sample !== 'undefined' && this.params.solution.sample !== '');
      this.params.behaviour.enableRetry = this.params.behaviour.enableRetry || false;
  
      // Determine the minimum number of characters that should be entered
      this.params.behaviour.minimumLength = this.params.behaviour.minimumLength || 0;
      if (this.params.behaviour.maximumLength !== undefined) {
        this.params.behaviour.minimumLength = Math.min(this.params.behaviour.minimumLength, this.params.behaviour.maximumLength);
      }
  
      const scoreMax = 100;
      // scoreMastering: score indicating mastery and maximum number on progress bar (can be < scoreMax)
      this.scoreMastering = this.params.behaviour.percentageMastering === undefined ?
        scoreMax :
        this.params.behaviour.percentageMastering * scoreMax / 100;
  
      // scorePassing: score to pass the task (<= scoreMastering)
      this.scorePassing = Math.min(
        this.getMaxScore(),
        this.params.behaviour.percentagePassing * scoreMax / 100 || 0);
  
      this.solution = this.buildSolution();
    }
  
    // Extends Question
    Development.prototype = Object.create(Question.prototype);
    Development.prototype.constructor = Development;
  
    /**
     * Register the DOM elements with H5P.Question.
     */
    Development.prototype.registerDomElements = function () 
    {
      const that = this;
      
  
      // Check whether status bar is needed
      const statusBar = (
        this.params.behaviour.minimumLength ||
        this.params.behaviour.maximumLength ||
        (H5PIntegration && H5PIntegration.saveFreq)
      );
  
      // Create InputField
      this.inputField = new H5P.Development.InputField({
        taskDescription: this.params.taskDescription,
        placeholderText: this.params.placeholderText,
        maximumLength: this.params.behaviour.maximumLength,
        remainingChars: this.params.remainingChars,
        inputFieldSize: this.params.behaviour.inputFieldSize,
        previousState: this.previousState,
        statusBar: statusBar
      }, {
        onInteracted: (function (params) {
          that.handleInteracted(params);
        }),
        onInput: (function () {
          that.handleInput();
        })
      });
  
      // Register task introduction text
      this.setIntroduction(this.inputField.getIntroduction());
  
      // Register content
      this.content = this.inputField.getContent();
      this.setContent(this.content);
  
      // Register Buttons
      this.addButtons();
    }

    /**
    * Add all the buttons that shall be passed to H5P.Question.
    */
    Development.prototype.addButtons = function () {
    const that = this;

    // Show solution button
    that.addButton('show-solution', that.params.showSolution, function () {
      // Not using a parameter for showSolutions to not mess with possibe future contract changes
      that.internalShowSolutionsCall = true;
      that.showSolutions();
      that.internalShowSolutionsCall = false;
    }, false, {
      'aria-label': this.params.ariaShowSolution
    }, {});

    // Check answer button
    that.addButton('check-answer', that.params.checkAnswer, function () {
      // Show message if the minimum number of characters has not been met
      if (that.inputField.getText().length < that.params.behaviour.minimumLength) {
        const message = that.params.notEnoughChars.replace(/@chars/g, that.params.behaviour.minimumLength);
        that.inputField.setMessageChars(message, true);
        that.read(message);
        return;
      }

      that.inputField.disable();
      /*
       * Only set true on "check". Result computation may take some time if
       * there are many keywords due to the fuzzy match checking, so it's not
       * a good idea to do this while typing.
       */
      that.isAnswered = true;
      that.handleEvaluation();

      if (that.params.behaviour.enableSolutionsButton === true) {
        that.showButton('show-solution');
      }
      that.hideButton('check-answer');
    }, this.params.behaviour.enableCheckButton, {
      'aria-label': this.params.ariaCheck
    }, {
      contentData: this.extras,
      textIfSubmitting: this.params.submitAnswer,
    });

    // Retry button
    that.addButton('try-again', that.params.tryAgain, function () {
      that.resetTask();
    }, false, {
      'aria-label': this.params.ariaRetry
    }, {});
  };

  /**
   * Get the user input from DOM.
   * @param {string} [linebreakReplacement=' '] Replacement for line breaks.
   * @return {string} Cleaned input.
   */
   Development.prototype.getInput = function (linebreakReplacement) {
    linebreakReplacement = linebreakReplacement || ' ';

    return this.inputField
      .getText()
      .replace(/(\r\n|\r|\n)/g, linebreakReplacement)
      .replace(/\s\s/g, ' ');
  };

  /**
   * Handle user interacted.
   * @param {object} params Parameters.
   * @param {boolean} [params.updateScore] If true, will trigger score computation.
   */
   Development.prototype.handleInteracted = function (params) {
    params = params || {};

    // Deliberately keeping the state once answered
    this.isAnswered = this.isAnswered || this.inputField.getText().length > 0;
    if (params.updateScore) {
      // Only triggered when explicitly requested due to potential complexity
      this.updateScore();
    }

    this.triggerXAPI('interacted');
  };

  /**
   * Check if Document has been submitted/minimum length met.
   * @return {boolean} True, if answer was given.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
   */
   Development.prototype.getAnswerGiven = function () {
    return this.isAnswered;
  };
  /**
   * Get latest score.
   * @return {number} latest score.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
   */
   Development.prototype.getScore = function () {
    // Return value is rounded because reporting module for moodle's H5P plugin expects integers
    return (this.params.behaviour.ignoreScoring) ? this.getMaxScore() : Math.round(this.score);
  };

  /**
   * Get maximum possible score.
   * @return {number} Score necessary for mastering.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
   */
  Development.prototype.getMaxScore = function () {
    // Return value is rounded because reporting module for moodle's H5P plugin expects integers
    return (this.params.behaviour.ignoreScoring) ? this.params.behaviour.pointsHost || 0 : Math.round(this.scoreMastering);
  };
  /**
   * Show solution.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
   */
   Development.prototype.showSolutions = function () {
    this.inputField.disable();

    if (typeof this.params.solution.sample !== 'undefined' && this.params.solution.sample !== '') {
      // We add the sample solution here to make cheating at least a little more difficult
      if (this.solution.getElementsByClassName(SOLUTION_SAMPLE)[0].children.length === 0) {
        const text = document.createElement('div');
        text.classList.add(SOLUTION_SAMPLE_TEXT);
        text.innerHTML = this.params.solution.sample;
        this.solution.getElementsByClassName(SOLUTION_SAMPLE)[0].appendChild(text);
      }

      // Insert solution after explanations or content.
      const predecessor = this.content.parentNode;

      predecessor.parentNode.insertBefore(this.solution, predecessor.nextSibling);

      // Useful for accessibility, but seems to jump to wrong position on some Safari versions
      this.solutionAnnouncer.focus();
    }

    this.hideButton('show-solution');

    // Handle calls from the outside
    if (!this.internalShowSolutionsCall) {
      this.hideButton('check-answer');
      this.hideButton('try-again');
    }

    this.trigger('resize');
  };
  /**
   * Reset task.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
   */
   Development.prototype.resetTask = function () {
    this.setExplanation();
    this.removeFeedback();
    this.hideSolution();

    this.hideButton('show-solution');
    this.hideButton('try-again');

    // QuestionSet can control check button despite not in Question Type contract
    if (this.params.behaviour.enableCheckButton) {
      this.showButton('check-answer');
    }

    this.inputField.enable();
    this.inputField.focus();

    this.isAnswered = false;
  };
  /**
   * Get xAPI data.
   * @return {Object} xAPI statement.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
   Development.prototype.getXAPIData = function () {
    return {
      statement: this.getXAPIAnswerEvent().data.statement
    };
  };
  /**
   * Determine whether the task has been passed by the user.
   * @return {boolean} True if user passed or task is not scored.
   */
   Development.prototype.isPassed = function () {
    return (this.params.behaviour.ignoreScoring || this.getScore() >= this.scorePassing);
  };

  /**
   * Update score.
   */
  Development.prototype.updateScore = function () {
    this.score = Math.min(this.computeScore(), this.getMaxScore());
  };
  /**
   * Handle the evaluation.
   */
   Development.prototype.handleEvaluation = function () {

    // Not all keyword groups might be necessary for mastering
    this.updateScore();
    const textScore = H5P.Question
      .determineOverallFeedback(this.params.overallFeedback, this.getScore() / this.getMaxScore())
      .replace('@score', this.getScore())
      .replace('@total', this.getMaxScore());

    if (!this.params.behaviour.ignoreScoring && this.getMaxScore() > 0) {
      const ariaMessage = (this.params.ariaYourResult)
        .replace('@score', ':num')
        .replace('@total', ':total');
      this.setFeedback(textScore, this.getScore(), this.getMaxScore(), ariaMessage);
    }

    // Show and hide buttons as necessary
    this.handleButtons(this.getScore());

    // Trigger xAPI statements as necessary
    this.handleXAPI();

    this.trigger('resize');
  };

  /**
   * Build solution DOM object.
   * @return {Object} DOM object.
   */
  Development.prototype.buildSolution = function () {
    const solution = document.createElement('div');
    solution.classList.add(SOLUTION_CONTAINER);

    this.solutionAnnouncer = document.createElement('div');
    this.solutionAnnouncer.setAttribute('tabindex', '0');
    this.solutionAnnouncer.setAttribute('aria-label', this.params.ariaNavigatedToSolution);
    this.solutionAnnouncer.addEventListener('focus', function (event) {
      // Just temporary tabbable element. Will be announced by readspaker.
      event.target.blur();
      event.target.setAttribute('tabindex', '-1');
    });
    solution.appendChild(this.solutionAnnouncer);

    const solutionTitle = document.createElement('div');
    solutionTitle.classList.add(SOLUTION_TITLE);
    solutionTitle.innerHTML = this.params.solutionTitle;
    solution.appendChild(solutionTitle);

    const solutionIntroduction = document.createElement('div');
    solutionIntroduction.classList.add(SOLUTION_INTRODUCTION);
    solutionIntroduction.innerHTML = this.params.solution.introduction;
    solution.appendChild(solutionIntroduction);

    const solutionSample = document.createElement('div');
    solutionSample.classList.add(SOLUTION_SAMPLE);
    solution.appendChild(solutionSample);

    return solution;
  };

  /**
   * Hide the solution.
   */
  Development.prototype.hideSolution = function () {
    if (this.solution.parentNode !== null) {
      this.solution.parentNode.removeChild(this.solution);
    }
  };
  /**
   * Compute the score for the results.
   * 
   * @return {number} Score.
   */
  Development.prototype.computeScore = function()
  {
      console.log(this.getInput().length);

    
    if(this.getInput().length > 0)
    {
        return 100;
    }
    else{
        return 0;
    }
  };

  /**
   * Handle buttons' visibility.
   * @param {number} score - Score the user received.
   */
  Development.prototype.handleButtons = function (score) {
    if (this.params.solution.sample && !this.solution) {
      this.showButton('show-solution');
    }

    // We need the retry button if the mastering score has not been reached or scoring is irrelevant
    if (score < this.getMaxScore() || this.params.behaviour.ignoreScoring || this.getMaxScore() === 0) {
      if (this.params.behaviour.enableRetry) {
        this.showButton('try-again');
      }
    }
    else {
      this.hideButton('try-again');
    }
  };

  /**
   * Handle xAPI event triggering
   * @param {number} score - Score the user received.
   */
  Development.prototype.handleXAPI = function () {
    this.trigger(this.getXAPIAnswerEvent());

    // Additional xAPI verbs that might be useful for making analytics easier
    if (!this.params.behaviour.ignoreScoring && this.getMaxScore() > 0) {
      if (this.getScore() < this.scorePassing) {
        this.trigger(this.createEssayXAPIEvent('failed'));
      }
      else {
        this.trigger(this.createEssayXAPIEvent('passed'));
      }
      if (this.getScore() >= this.getMaxScore()) {
        this.trigger(this.createEssayXAPIEvent('mastered'));
      }
    }
  };

  /**
   * Create an xAPI event for Essay.
   * @param {string} verb - Short id of the verb we want to trigger.
   * @return {H5P.XAPIEvent} Event template.
   */
  Development.prototype.createEssayXAPIEvent = function (verb) {
    const xAPIEvent = this.createXAPIEventTemplate(verb);
    Development.extend(
      xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
      this.getxAPIDefinition());
    return xAPIEvent;
  };

  /**
   * Get the xAPI definition for the xAPI object.
   * return {Object} XAPI definition.
   */
  Development.prototype.getxAPIDefinition = function () {
    const definition = {};
    definition.name = {};
    definition.name[this.languageTag] = this.getTitle();
    // Fallback for h5p-php-reporting, expects en-US
    definition.name['en-US'] = definition.name[this.languageTag];
    // The H5P reporting module expects the "blanks" to be added to the description
    definition.description = {};
    definition.description[this.languageTag] = this.params.taskDescription + Development.FILL_IN_PLACEHOLDER;
    // Fallback for h5p-php-reporting, expects en-US
    definition.description['en-US'] = definition.description[this.languageTag];
    definition.type = 'http://id.tincanapi.com/activitytype/essay';
    definition.interactionType = 'long-fill-in';
    /*
     * The official xAPI documentation discourages to use a correct response
     * pattern it if the criteria for a question are complex and correct
     * responses cannot be exhaustively listed. They can't.
     */
    return definition;
  };

  /**
   * Build xAPI answer event.
   * @return {H5P.XAPIEvent} xAPI answer event.
   */
  Development.prototype.getXAPIAnswerEvent = function () {
    const xAPIEvent = this.createEssayXAPIEvent('answered');

    xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(), this, true, this.isPassed());
    xAPIEvent.data.statement.result.response = this.inputField.getText();

    return xAPIEvent;
  };

  /**
   * Extend an array just like JQuery's extend.
   * @param {...Object} arguments - Objects to be merged.
   * @return {Object} Merged objects.
   */
  Development.extend = function () {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          if (typeof arguments[0][key] === 'object' &&
              typeof arguments[i][key] === 'object') {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  };

  /**
   * Get task title.
   * @return {string} Title.
   */
  Development.prototype.getTitle = function () {
    let raw;
    if (this.extras.metadata) {
      raw = this.extras.metadata.title;
    }
    raw = raw || Development.DEFAULT_DESCRIPTION;

    // H5P Core function: createTitle
    return H5P.createTitle(raw);
  };

  /**
   * Format language tag (RFC 5646). Assuming "language-coutry". No validation.
   * Cmp. https://tools.ietf.org/html/rfc5646
   * @param {string} languageTag Language tag.
   * @return {string} Formatted language tag.
   */
  Development.formatLanguageCode = function (languageCode) {
    if (typeof languageCode !== 'string') {
      return languageCode;
    }

    /*
     * RFC 5646 states that language tags are case insensitive, but
     * recommendations may be followed to improve human interpretation
     */
    const segments = languageCode.split('-');
    segments[0] = segments[0].toLowerCase(); // ISO 639 recommendation
    if (segments.length > 1) {
      segments[1] = segments[1].toUpperCase(); // ISO 3166-1 recommendation
    }
    languageCode = segments.join('-');

    return languageCode;
  };

  /**
   * Retrieve true string from HTML encoded string
   * @param {string} input - Input string.
   * @return {string} Output string.
   */
  Development.prototype.htmlDecode = function (input) {
    const dparser = new DOMParser().parseFromString(input, 'text/html');
    return dparser.documentElement.textContent;
  };

  /**
   * Get current state for H5P.Question.
   * @return {Object} Current state.
   */
  Development.prototype.getCurrentState = function () {
    this.inputField.updateMessageSaved(this.params.messageSave);

    // We could have just used a string, but you never know when you need to store more parameters
    return {
      'inputField': this.inputField.getText()
    };
  };

  /** @constant {string}
   * latin special chars: \u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF
   * greek chars: \u0370-\u03FF
   * kyrillic chars: \u0400-\u04FF
   * hiragana + katakana: \u3040-\u30FF
   * common CJK characters: \u4E00-\u62FF\u6300-\u77FF\u7800-\u8CFF\u8D00-\u9FFF
   * thai chars: \u0E00-\u0E7F
   */
  Development.CHARS_WILDCARD = '[A-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0370-\u03FF\u0400-\u04FF\u3040-\u309F\u3040-\u30FF\u4E00-\u62FF\u6300-\u77FF\u7800-\u8CFF\u8D00-\u9FFF\u0E00-\u0E7F]';

  /** @constant {string}
   * Required to be added to xAPI object description for H5P reporting
   */
  Development.FILL_IN_PLACEHOLDER = '__________';

  /** @constant {string} */
  Development.DEFAULT_DESCRIPTION = 'Development';

  /** @constant {string} */
  Development.REGULAR_EXPRESSION_ASTERISK = ':::H5P-Essay-REGEXP-ASTERISK:::';

    
    

    return Development;
}(H5P.jQuery, H5P.Question);
