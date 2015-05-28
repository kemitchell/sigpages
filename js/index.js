var updateEvent = Reflux.createAction();

var projectStore = Reflux.createStore({
  init: function() {
    this.listenTo(updateEvent, function(newProject) {
      this.project = newProject;
      this.trigger(this.project);
    });
  },
  getInitialState: function() {
    return Immutable.fromJS({
      agreement: 'License Agreement',
      parties: [
        [{name: 'Erroll Flynn'}],
        [{name: 'Basil Rathbone'}]
      ]
    });
  }
});

var create = React.createElement.bind(React);

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

function simpleComponent(name, render) {
  return component(name, {render: render});
}

var Party = simpleComponent('Party', function() {
  return React.DOM.p({
    className: 'simpleLine'
  }, this.props.party.toJSON());
});

var Block = simpleComponent('Block', function() {
  return React.DOM.div(
    {className: 'block'},
    create(Party, {party: this.props.party})
  );
});

var Paragraph = simpleComponent('Paragraph', function() {
  return React.DOM.p(
    {},
    'The parties are signing this ' + this.props.agreement +
    ' on the date stated in the introductory clause.'
  );
});

var Page = simpleComponent('Page', function() {
  return React.DOM.div(
    {className: 'page'},
    [
      create(Paragraph, {agreement: this.props.agreement}),
      create(Block, {party: this.props.party})
    ]
  );
});

var Project = component('Project', {
  componentWillMount: function() {
    var onNewProject = function(newProject) {
      this.setState({project: newProject});
    }.bind(this);
    this.stopListening = projectStore.listen(onNewProject);
    onNewProject(projectStore.getInitialState());
  },
  componentWillUnmount: function() {
    this.stopListening();
  },
  render: function() {
    var project = this.state.project;
    return React.DOM.div(null, [
      project.get('parties')
        .map(function(party) {
          return React.createElement(Page, {
            agreement: project.get('agreement'),
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
