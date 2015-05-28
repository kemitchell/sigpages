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

var partiesStore = Reflux.createStore({
  init: function() {
    this.value = this.getInitialState();
  },
  getInitialState: function() {
    return fromJS([
      [{name: 'Erroll Flynn'}],
      [{name: 'Basil Rathbone'}]
    ]);
  }
});

var projectStore = Reflux.createStore({
  init: function() {
    this.value = this.getInitialState();
    this.listenTo(titleStore, function(title) {
      this.value = this.value.set('title', title);
      this.trigger(this.value);
    }.bind(this));
  },
  getInitialState: function() {
    return fromJS({
      title: titleStore.getInitialState(),
      parties: partiesStore.getInitialState()
    });
  }
});

var create = React.createElement.bind(React);
var div = React.DOM.div.bind(React.DOM);
var p = React.DOM.p.bind(React.DOM);

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

var Party = render('Party', function() {
  return p({className: 'simpleLine'}, this.props.party.toJSON());
});

var Block = render('Block', function() {
  return div(
    {className: 'block'},
    create(Party, {party: this.props.party})
  );
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
  handleSubmit: function(event) {
    event.preventDefault();
    this.handleBlur();
  },
  render: function() {
    return React.DOM.form(
      {
        className: 'title',
        onSubmit: this.handleSubmit
      },
      [
        React.DOM.label(null, 'Agreement Title'),
        React.DOM.input({
          type: 'text',
          onChange: this.handleChange,
          onBlur: this.handleBlur,
          value: this.state.title
        })
      ]
    );
  }
});

var Paragraph = render('Paragraph', function() {
  return p(
    {},
    'The parties are signing this ' + this.props.title +
    ' on the date stated in the introductory clause.'
  );
});

var Page = render('Page', function() {
  return div(
    {className: 'page'},
    [
      create(Paragraph, {title: this.props.title}),
      create(Block, {party: this.props.party})
    ]
  );
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
      create(TitleInput, {title: project.get('title')}),
      project.get('parties')
        .map(function(party) {
          return React.createElement(Page, {
            title: project.get('title'),
            party: party
          });
        })
    ]);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  React.initializeTouchEvents(true);
  React.render(create(Project), document.getElementById('mount'));
});
