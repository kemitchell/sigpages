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

var addParty = Reflux.createAction();
var deleteParty = Reflux.createAction();

var addEntity = Reflux.createAction();
var deleteEntity = Reflux.createAction();

var nameChange = Reflux.createAction();
var titleChange = Reflux.createAction();

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
    this.listenTo(deleteParty, function(party) {
      this.value = this.value.delete(party);
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(addParty, function() {
      this.value = this.value.push(fromJS([defaultPerson]));
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(addEntity, function(party) {
      this.value = this.value.set(
        party,
        this.value.get(party).unshift(defaultEntity)
      );
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(deleteEntity, function(party, entity) {
      this.value = this.value.deleteIn([party, entity]);
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(nameChange, function(party, entity, value) {
      this.value = this.value.setIn([party, entity, 'name'], value);
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(titleChange, function(party, entity, value) {
      this.value = this.value.setIn([party, entity, 'title'], value);
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

function editableInput(name, key, updateEvent, eventArgumentProps) {
  return component(name, {
    getInitialState: function() {
      return {value: this.props[key]};
    },
    handleBlur: function() {
      var props = this.props;
      var eventArguments = eventArgumentProps
        .map(function(key) {
          return props[key];
        })
        .concat(this.state.value);
      updateEvent.apply(this, eventArguments);
    },
    handleChange: function(event) {
      this.setState({value: event.target.value});
    },
    render: function() {
      return div({
        className: 'wrapper'
      }, [
        (this.state.value ?
          span({
            key: 'val',
            className: 'printOnly'
          }, this.state.value) :
          span({
            key: 'val',
            className: 'printOnly spacer'
          })),
        React.DOM.input({
          key: 'input',
          className: 'editorOnly',
          onChange: this.handleChange,
          onBlur: this.handleBlur,
          value: this.state.value
        })
      ]);
    }
  });
}

var NameInput = editableInput('NameInput', 'name', nameChange, [
  'partyIndex', 'entityIndex'
]);

var TitleInput = editableInput('TitleInput', 'title', titleChange, [
  'partyIndex', 'entityIndex'
]);

var EntityLine = render('EntityLine', function() {
  var entity = this.props.entity;
  if (this.props.top) {
    return div({
      className: 'line'
    }, [
      create(DeleteEntityButton, {
        key: 'delete',
        partyIndex: this.props.partyIndex,
        entityIndex: this.props.entityIndex
      }),
      create(NameInput, {
        key: 'name',
        partyIndex: this.props.partyIndex,
        entityIndex: this.props.entityIndex,
        name: entity.get('name')
      })
    ]);
  } else {
    return div({
      className: 'line'
    }, [
      create(DeleteEntityButton, {
        key: 'delete',
        partyIndex: this.props.partyIndex,
        entityIndex: this.props.entityIndex
      }),
      'By: ',
      create(NameInput, {
        key: 'name',
        partyIndex: this.props.partyIndex,
        entityIndex: this.props.entityIndex,
        name: entity.get('name')
      }),
      ', its ',
      create(TitleInput, {
        key: 'title',
        partyIndex: this.props.partyIndex,
        entityIndex: this.props.entityIndex,
        title: entity.get('title')
      })
    ]);
  }
});

var FinalLine = render('FinalLine', function() {
  var person = this.props.person;
  if (this.props.individual) {
    return div({
      className: 'line simple final'
    }, [
      create(NameInput, {
        key: 'input',
        partyIndex: this.props.partyIndex,
        entityIndex: this.props.entityIndex,
        name: person.get('name')
      })
    ]);
  } else {
    return div({
      className: 'final'
    }, [
      div({
        key: 'signature',
        className: 'blank'
      }, [
        span({
          key: 'label',
          className: 'label'
        }, [
          'By: '
        ]),
        span({
          key: 'spacer',
          className: 'spacer'
        })
      ]),
      div({
        key: 'name',
        className: 'blank'
      }, [
        span({key: 'label', className: 'label'}, 'Name: '),
        create(NameInput, {
          key: 'input',
          partyIndex: this.props.partyIndex,
          entityIndex: this.props.entityIndex,
          name: person.get('name')
        })
      ]),
      div({
        key: 'title',
        className: 'blank'
      }, [
        span({key: 'label', className: 'label'}, 'Title: '),
        create(TitleInput, {
          key: 'input',
          partyIndex: this.props.partyIndex,
          entityIndex: this.props.entityIndex,
          title: person.get('title')
        })
      ])
    ]);
  }
});

var Party = render('Party', function() {
  var props = this.props;
  return div(null, [
    props.party
      .slice(0, -1)
      .map(function(entity, entityIndex) {
        return create(EntityLine, {
          key: entityIndex,
          top: entityIndex === 0,
          partyIndex: props.partyIndex,
          entityIndex: entityIndex,
          entity: entity
        });
      }),
    create(FinalLine, {
      key: 'final',
      partyIndex: props.partyIndex,
      entityIndex: props.party.count() - 1,
      individual: props.party.count() < 2,
      person: props.party.last()
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
  return div({
    className: 'block'
  }, [
    this.props.dateStyle === 'Each Signature' ?
      create(DateLine, {
        key: 'date',
        dateStyle: this.props.dateStyle
      }) : null,
    div({
      key: 'add',
      className: 'line editorOnly'
    }, [
      create(AddEntityButton, {
        key: 'add',
        partyIndex: this.props.partyIndex
      })
    ]),
    create(Party, {
      key: 'party',
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
      React.DOM.label({key: 'label'}, 'Agreement Title'),
      React.DOM.input({
        key: 'input',
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
      React.DOM.label({key: 'label'}, 'Date'),
      React.DOM.select(
        {key: 'select', onChange: this.handleChange},
        ['Introductory Clause', 'Each Signature']
          .map(function(value) {
            return React.DOM.option({
              key: value,
              value: value
            }, value);
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
    return React.DOM.form({
      className: 'settings editorOnly',
      onSubmit: this.handleSubmit
    }, [
      create(AgreementInput, {
        key: 'agreement',
        agreement: this.props.agreement
      }),
      create(DateStyleSelect, {
        key: 'datStyle'
      })
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
  return div({
    className: 'page'
  }, [
    create(DeletePartyButton, {
      key: 'delete',
      partyIndex: this.props.partyIndex
    }),
    create(Paragraph, {
      key: 'paragraph',
      dateStyle: this.props.dateStyle,
      agreement: this.props.agreement
    }),
    create(Block, {
      key: 'block',
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
      return React.DOM.button({
        className: 'editorOnly',
        onClick: this.handleClick
      }, text);
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
        key: 'settings',
        dateStyle: project.get('dateStyle'),
        agreement: project.get('agreement')
      }),
      div({
        key: 'buttons',
        className: 'buttons editorOnly'
      }, [
        create(AddPartyButton, {
          key: 'addParty'
        }),
        create(PrintButton, {
          key: 'print'
        })
      ]),
      div({
        key: 'pages'
      },
        project.get('parties')
          .map(function(party, partyIndex) {
            return create(Page, {
              key: partyIndex,
              partyIndex: partyIndex,
              dateStyle: project.get('dateStyle'),
              party: party,
              agreement: project.get('agreement')
            });
          })
      )
    ]);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  React.initializeTouchEvents(true);
  React.render(create(Project), document.getElementById('mount'));
});
