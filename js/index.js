var fromJS = Immutable.fromJS.bind(Immutable);

var agreementChange = Reflux.createAction();

var agreementStore = Reflux.createStore({
  init: function() {
    this.value = this.getInitialState();
    this.listenTo(agreementChange, function(agreement) {
      this.value = agreement;
      this.trigger(this.value);
    }.bind(this));
  },
  getInitialState: function() {
    return 'Agreement';
  }
});

var dateStyleChange = Reflux.createAction();

var dateStyleStore = Reflux.createStore({
  init: function() {
    this.value = this.getInitialState();
    this.listenTo(dateStyleChange, function(newValue) {
      this.value = newValue;
      this.trigger(this.value);
    }.bind(this));
  },
  getInitialState: function() {
    return 'Introductory Clause';
  }
});

var deleteParty = Reflux.createAction();
var addParty = Reflux.createAction();
var addEntity = Reflux.createAction();
var deleteEntity = Reflux.createAction();

var defaultPerson = fromJS({
  type: 'person',
  name: 'Shannon Signer',
  title: ''
});

var defaultEntity = fromJS({
  type: 'entity',
  name: 'Some, Inc.',
  title: ''
});

var partiesStore = Reflux.createStore({
  init: function() {
    this.value = this.getInitialState();
    this.listenTo(deleteParty, function(partyIndex) {
      this.value = this.value.delete(partyIndex);
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(addParty, function() {
      this.value = this.value.push(fromJS([defaultPerson]));
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(addEntity, function(partyIndex) {
      this.value = this.value.set(
        partyIndex,
        this.value.get(partyIndex).unshift(defaultEntity)
      );
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(deleteEntity, function(partyIndex, entityIndex) {
      this.value = this.value.deleteIn([partyIndex, entityIndex]);
      this.trigger(this.value);
    }.bind(this));
  },
  getInitialState: function() {
    return fromJS([
      [defaultPerson],
      [defaultEntity, defaultPerson]
    ]);
  }
});

var projectStore = Reflux.createStore({
  init: function() {
    this.value = this.getInitialState();
    this.listenTo(agreementStore, function(agreement) {
      this.value = this.value.set('agreement', agreement);
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(dateStyleStore, function(dateStyle) {
      this.value = this.value.set('dateStyle', dateStyle);
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(partiesStore, function(parties) {
      this.value = this.value.set('parties', parties);
      this.trigger(this.value);
    }.bind(this));
  },
  getInitialState: function() {
    return fromJS({
      agreement: agreementStore.getInitialState(),
      dateStyle: dateStyleStore.getInitialState(),
      parties: partiesStore.getInitialState()
    });
  }
});

var create = React.createElement.bind(React);
var div = React.DOM.div.bind(React.DOM);
var p = React.DOM.p.bind(React.DOM);
var span = React.DOM.span.bind(React.DOM);

function component(name, additionalProperties) {
  var properties = {
    displayName: name,
    mixins: [React.addons.PureRenderMixin]
  };
  Object.keys(additionalProperties)
    .forEach(function(key) {
      properties[key] = additionalProperties[key];
    });
  return React.createClass(properties);
}

function render(name, renderFunction) {
  return component(name, {render: renderFunction});
}

var NameInput = render('NameInput', function() {
  return div({className: 'wrapper'}, [
    (this.props.name ?
      span({className: 'printOnly'}, this.props.name) :
      span({className: 'printOnly spacer'})),
    React.DOM.input({placeholder: 'Name', value: this.props.name})
  ]);
});

var TitleInput = render('TitleInput', function() {
  return div({className: 'wrapper'}, [
    (this.props.title ?
      span({className: 'printOnly'}, this.props.title) :
      span({className: 'printOnly spacer'})),
    React.DOM.input({placeholder: 'Title', value: this.props.title})
  ]);
});

var EntityLine = render('EntityLine', function() {
  var entity = this.props.entity;
  if (this.props.top) {
    return div({className: 'line'}, [
      create(DeleteEntityButton, {
        partyIndex: this.props.partyIndex,
        entityIndex: this.props.entityIndex
      }),
      create(NameInput, {name: entity.get('name')})
    ]);
  } else {
    return div({className: 'line'}, [
      create(DeleteEntityButton, {
        partyIndex: this.props.partyIndex,
        entityIndex: this.props.entityIndex
      }),
      'By: ',
      create(NameInput, {name: entity.get('name')}),
      ', its ',
      create(TitleInput, {title: entity.get('title')})
    ]);
  }
});

var FinalLine = render('FinalLine', function() {
  var person = this.props.person;
  if (this.props.individual) {
    return div({className: 'line simple final'}, [
      create(NameInput, {name: person.get('name')})
    ]);
  } else {
    return div({className: 'final'}, [
      div({className: 'blank'}, [
        span({className: 'label'}, 'By: '),
        span({className: 'spacer'})
      ]),
      div({className: 'blank'}, [
        span({className: 'label'}, 'Name: '),
        create(NameInput, {name: person.get('name')})
      ]),
      div({className: 'blank'}, [
        span({className: 'label'}, 'Title: '),
        create(TitleInput, {title: person.get('title')})
      ])
    ]);
  }
});

var Party = render('Party', function() {
  var props = this.props;
  return div(null, [
    this.props.party
      .slice(0, -1)
      .map(function(entity, entityIndex) {
        return create(EntityLine, {
          top: entityIndex === 0,
          partyIndex: props.partyIndex,
          entityIndex: entityIndex,
          entity: entity
        });
      }),
    create(FinalLine, {
      individual: this.props.party.count() < 2,
      person: this.props.party.last()
    })
  ]);
});

var DateLine = render('DateLine', function() {
  return p({className: 'dateLine'}, [
    this.props.dateStyle === 'Each Signature' ? 'Date' : ''
  ]);
});

var AddEntityButton = button(
  'AddEntityButton',
  'Add Entity',
  function() {
    addEntity(this.props.partyIndex);
  }
);

var DeleteEntityButton = button(
  'DeleteEntityButton',
  'Delete Entity',
  function() {
    deleteEntity(this.props.partyIndex, this.props.entityIndex);
  }
);

var Block = render('Block', function() {
  return div({className: 'block'}, [
    this.props.dateStyle === 'Each Signature' ?
      create(DateLine, {dateStyle: this.props.dateStyle}) : null,
    div({className: 'line editorOnly'}, [
      create(AddEntityButton, {partyIndex: this.props.partyIndex})
    ]),
    create(Party, {
      partyIndex: this.props.partyIndex,
      party: this.props.party
    })
  ]);
});

var AgreementInput = component('AgreementInput', {
  getInitialState: function() {
    return {agreement: this.props.agreement};
  },
  handleBlur: function() {
    agreementChange(this.state.agreement);
  },
  handleChange: function(event) {
    this.setState({agreement: event.target.value});
  },
  render: function() {
    return div(null, [
      React.DOM.label(null, 'Agreement Title'),
      React.DOM.input({
        type: 'text',
        onChange: this.handleChange,
        onBlur: this.handleBlur,
        value: this.state.agreement
      })
    ]);
  }
});

var DateStyleSelect = component('DateStyleSelect', {
  getInitialState: function() {
    return {dateStyle: 'Introductory Clause'};
  },
  handleChange: function(event) {
    dateStyleChange(event.target.value);
  },
  render: function() {
    return div(null, [
      React.DOM.label(null, 'Date'),
      React.DOM.select(
        {onChange: this.handleChange},
        ['Introductory Clause', 'Each Signature']
          .map(function(value) {
            return React.DOM.option({value: value}, value);
          })
      )
    ]);
  }
});

var SettingsForm = component('SettingsForm', {
  handleSubmit: function(event) {
    event.preventDefault();
  },
  render: function() {
    return React.DOM.form({onSubmit: this.handleSubmit}, [
      create(AgreementInput, {agreement: this.props.agreement}),
      create(DateStyleSelect)
    ]);
  }
});

var Paragraph = render('Paragraph', function() {
  if (this.props.dateStyle === 'Introductory Clause') {
    return p(null, [
      'The parties are signing this ' + this.props.agreement +
      ' on the date stated in the introductory clause.'
    ]);
  } else {
    return p(null, [
      'The parties are signing this ' + this.props.agreement +
      ' on the dates written beside their respective signatures.'
    ]);
  }
});

var Page = render('Page', function() {
  return div({className: 'page'}, [
    create(DeletePartyButton, {partyIndex: this.props.partyIndex}),
    create(Paragraph, {
      dateStyle: this.props.dateStyle,
      agreement: this.props.agreement
    }),
    create(Block, {
      partyIndex: this.props.partyIndex,
      dateStyle: this.props.dateStyle,
      party: this.props.party
    })
  ]);
});

function button(name, text, handleClick) {
  return component(name, {
    handleClick: handleClick,
    render: function() {
      return React.DOM.button({onClick: this.handleClick}, text);
    }
  });
}

var AddPartyButton = button('AddPartyButton', 'Add Party', function() {
  addParty();
});

var DeletePartyButton = button(
  'DeletePartyButton',
  'Delete Party',
  function() {
    deleteParty(this.props.partyIndex);
  }
);

var PrintButton = button('PrintButton', 'Print', function() {
  window.print();
});

var Project = component('Project', {
  componentWillMount: function() {
    var onUpdate = function(project) {
      this.setState({project: project});
    }.bind(this);
    this.stopListening = projectStore.listen(onUpdate);
    onUpdate(projectStore.getInitialState());
  },
  componentWillUnmount: function() {
    this.stopListening();
  },
  render: function() {
    var project = this.state.project;
    return div(null, [
      create(SettingsForm, {
        dateStyle: project.get('dateStyle'),
        agreement: project.get('agreement')
      }),
      project.get('parties')
        .map(function(party, partyIndex) {
          return create(Page, {
            partyIndex: partyIndex,
            dateStyle: project.get('dateStyle'),
            party: party,
            agreement: project.get('agreement')
          });
        }),
      create(AddPartyButton),
      ' ',
      create(PrintButton)
    ]);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  React.initializeTouchEvents(true);
  React.render(create(Project), document.getElementById('mount'));
});
