var fromJS = Immutable.fromJS.bind(Immutable);

var titleChange = Reflux.createAction();

var titleStore = Reflux.createStore({
  init: function() {
    this.value = this.getInitialState();
    this.listenTo(titleChange, function(title) {
      this.value = title;
      this.trigger(this.value);
    }.bind(this));
  },
  getInitialState: function() {
    return 'Agreement';
  }
});

var dateChange = Reflux.createAction();

var dateStore = Reflux.createStore({
  init: function() {
    this.value = this.getInitialState();
    this.listenTo(dateChange, function(newValue) {
      this.value = newValue;
      this.trigger(this.value);
    }.bind(this));
  },
  getInitialState: function() {
    return 'Introductory Clause';
  }
});

var deleteBlock = Reflux.createAction();
var addBlock = Reflux.createAction();
var addEntity = Reflux.createAction();

var blocksStore = Reflux.createStore({
  init: function() {
    this.value = this.getInitialState();
    this.listenTo(deleteBlock, function(index) {
      this.value = this.value.delete(index);
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(addBlock, function() {
      this.value = this.value.push(fromJS({person: 'John Doe'}));
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(addEntity, function(index) {
      this.value = this.value.set(
        index,
        this.value.get(index).unshift(fromJS({
          type: 'entity',
          name: 'Some, Inc.',
          role: ''
        }))
      );
      this.trigger(this.value);
    }.bind(this));
  },
  getInitialState: function() {
    return fromJS([
      [
        {
          type: 'person',
          name: 'John Doe'}],
      [
        {
          type: 'entity',
          name: 'Some Fund, LLP'},
        {
          type: 'entity',
          name: 'Some Corporation, Inc.',
          role: 'General Partner'},
        {
          type: 'person',
          name: 'John Doe',
          role: ''}]]);
  }
});

var projectStore = Reflux.createStore({
  init: function() {
    this.value = this.getInitialState();
    this.listenTo(titleStore, function(title) {
      this.value = this.value.set('title', title);
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(dateStore, function(date) {
      this.value = this.value.set('date', date);
      this.trigger(this.value);
    }.bind(this));
    this.listenTo(blocksStore, function(blocks) {
      this.value = this.value.set('blocks', blocks);
      this.trigger(this.value);
    }.bind(this));
  },
  getInitialState: function() {
    return fromJS({
      title: titleStore.getInitialState(),
      date: dateStore.getInitialState(),
      blocks: blocksStore.getInitialState()
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

var NameField = render('NameField', function() {
  return div({className: 'wrapper'}, [
    (this.props.name ?
      span({className: 'printOnly'}, this.props.name) :
      span({className: 'printOnly spacer'})),
    React.DOM.input({placeholder: 'Name', value: this.props.name})
  ]);
});

var RoleField = render('RoleField', function() {
  return div({className: 'wrapper'}, [
    (this.props.role ?
      span({className: 'printOnly'}, this.props.role) :
      span({className: 'printOnly spacer'})),
    React.DOM.input({placeholder: 'Title', value: this.props.role})
  ]);
});

var EntityLine = render('EntityLine', function() {
  var entity = this.props.entity;
  if (this.props.top) {
    return div({className: 'line'}, [
      create(NameField, {name: entity.get('name')})
    ]);
  } else {
    return div({className: 'line'}, [
      'By: ',
      create(NameField, {name: entity.get('name')}),
      ', its ',
      create(RoleField, {role: entity.get('role')})
    ]);
  }
});

var FinalLine = render('FinalLine', function() {
  var person = this.props.person;
  if (this.props.individual) {
    return div({className: 'line simple final'}, [
      create(NameField, {name: person.get('name')})
    ]);
  } else {
    return div({className: 'final'}, [
      div({className: 'blank'}, [
        span({className: 'label'}, 'By: '),
        span({className: 'spacer'})
      ]),
      div({className: 'blank'}, [
        span({className: 'label'}, 'Name: '),
        create(NameField, {name: person.get('name')})
      ]),
      div({className: 'blank'}, [
        span({className: 'label'}, 'Title: '),
        create(RoleField, {name: person.get('role')})
      ])
    ]);
  }
});

var Party = render('Party', function() {
  return div(null, [
    this.props.party
      .slice(0, -1)
      .map(function(entity, index) {
        return create(EntityLine, {
          top: index === 0,
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
    this.props.date === 'Each Signature' ? 'Date' : ''
  ]);
});

var AddEntity = component('AddEntity', {
  handleClick: function() {
    addEntity(this.props.index);
  },
  render: function() {
    return React.DOM.button({
      onClick: this.handleClick
    }, 'Add Entity');
  }
});

var Block = render('Block', function() {
  return div({className: 'block'}, [
    this.props.date === 'Each Signature' ?
      create(DateLine, {date: this.props.date}) : null,
    div({className: 'line editorOnly'}, [
      create(AddEntity, {index: this.props.index})
    ]),
    create(Party, {party: this.props.party})
  ]);
});

var TitleInput = component('TitleInput', {
  getInitialState: function() {
    return {title: this.props.title};
  },
  handleBlur: function() {
    titleChange(this.state.title);
  },
  handleChange: function(event) {
    this.setState({title: event.target.value});
  },
  render: function() {
    return div(null, [
      React.DOM.label(null, 'Agreement Title'),
      React.DOM.input({
        type: 'text',
        onChange: this.handleChange,
        onBlur: this.handleBlur,
        value: this.state.title
      })
    ]);
  }
});

var DateSelect = component('DateSelect', {
  getInitialState: function() {
    return {date: 'Introductory Clause'};
  },
  handleChange: function(event) {
    dateChange(event.target.value);
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
      create(TitleInput, {title: this.props.title}),
      create(DateSelect)
    ]);
  }
});

var Paragraph = render('Paragraph', function() {
  if (this.props.date === 'Introductory Clause') {
    return p(null, [
      'The parties are signing this ' + this.props.title +
      ' on the date stated in the introductory clause.'
    ]);
  } else {
    return p(null, [
      'The parties are signing this ' + this.props.title +
      ' on the dates written beside their respective signatures.'
    ]);
  }
});

var Page = render('Page', function() {
  return div({className: 'page'}, [
    create(DeleteButton, {index: this.props.index}),
    create(Paragraph, {
      date: this.props.date,
      title: this.props.title
    }),
    create(Block, {
      index: this.props.index,
      date: this.props.date,
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

var AddButton = button('AddButton', 'Add', function() {
  addBlock();
});

var DeleteButton = button('DeleteButton', 'Delete Page', function() {
  deleteBlock(this.props.index);
});

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
        date: project.get('date'),
        title: project.get('title')
      }),
      project.get('blocks')
        .map(function(party, index) {
          return React.createElement(Page, {
            index: index,
            date: project.get('date'),
            party: party,
            title: project.get('title')
          });
        }),
      create(AddButton),
      ' ',
      create(PrintButton)
    ]);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  React.initializeTouchEvents(true);
  React.render(create(Project), document.getElementById('mount'));
});
