import * as Blockly from 'blockly/core';

export class FieldAutoComplete extends Blockly.FieldTextInput {
  constructor(value = undefined, validator = undefined, config = undefined) {

    super(value, validator);
    this.timer = null;
    this.boundEvents_ = [];
    console.log(config);
    this.serviceUrl = config.serviceUrl;
  }



  debounce(func, timeout = 500) {

    return (...args) => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }

  static fromJson(options) {
    return new FieldAutoComplete(
      options['value'], undefined, options);
  }

  showInlineEditor_(quietInput) {
    super.showInlineEditor_(quietInput);
    this.boundEvents_.push(Blockly.browserEvents.conditionalBind(this.htmlInput_, 'input', this, this.onAutoCompleteChange_));
  }

  onAutoCompleteChange_(e) {
    this.debounce(() => {
      this.showSuggestions(e.target.oldValue_);
    })();
  }

  async fetchSuggestions(term) {
    const request = {
      method: 'GET',
      cache: 'default'
    };
    
    const response = await fetch(`${this.serviceUrl}${term}`, request)
    return await response.json();
  }

  async showSuggestions(term) {
    Blockly.DropDownDiv.getContentDiv().innerHTML = null;
    const results = await this.fetchSuggestions(term);

    if (results.length > 0) {
      const editor = this.dropdownCreate_([...new Set(results.map(i => i.term))]);

      Blockly.DropDownDiv.getContentDiv().appendChild(editor);

      Blockly.DropDownDiv.setColour(
        this.sourceBlock_.style.colourPrimary,
        this.sourceBlock_.style.colourTertiary);

      Blockly.DropDownDiv.showPositionedByField(
        this, this.dropdownDispose_.bind(this));
    }
  }

  dropdownDispose_() {
    Blockly.DropDownDiv.getContentDiv().innerHTML = null;
  }

  dropdownCreate_(results) {
    const wrapper = document.createElement('div');
    wrapper.className = 'fieldAutocompleteContainer';

    results.forEach(result => {
      const item = document.createElement('div');
      item.className = "fieldAutoComplete";
      item.innerText = result
      Blockly.browserEvents.bind(item, 'click', this, this.onSuggestionAccepted_)
      wrapper.appendChild(item);
    })


    return wrapper;
  }

  onSuggestionAccepted_(e) {
    this.setEditorValue_(e.target.innerText);
    Blockly.WidgetDiv.hide();
    Blockly.DropDownDiv.hideIfOwner(this);
  }
}




Blockly.fieldRegistry.register('field_autocomplete', FieldAutoComplete);

Blockly.Css.register(
  /* eslint-disable indent */
  `.fieldAutoCompleteContainer {
        align-items: center;
        display: flex;
        height: 32px;
        justify-content: center;
        width: 150px;
      }
      .fieldAutoComplete {
        color: white;
        -webkit-appearance: none;
        background: transparent; /* override white in chrome */
        margin: 4px;
        padding: 0;
        width: 100%;
        cursor:pointer;
      }
      .fieldAutoComplete:focus {
        outline: none;
      }
     `
  /* eslint-enable indent */
);