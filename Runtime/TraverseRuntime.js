var Action = Backbone.Model.extend({
  initialize: function(playthrough, traverseAction) {
    this.playthrough = playthrough;
    this.traverseAction = traverseAction;
  },
  
  name: function() {
    return this.traverseAction.Name;
  },
  
  run: function() {
    this.traverseAction.Run();
    this.playthrough.trigger("action");
  }
});

var Playthrough = Backbone.Model.extend({
  initialize: function(core) {
    this.core = core;
  },
  
  pastChoices: function() {
    return _.keys(this.core.ChoiceResults).filter(function (choice) {
      // only return ones that are true in the results table
      return this.core.ChoiceResults[choice];
    }, this);
  },
  
  eligibleActions: function() {
    return _.map(this.core.GetAllEligibleActions(),
      function (action) { return new Action(this, action); }, this);
  }
});

var ActionView = Backbone.View.extend({
  
  tagName: "button",
  className: "action",
  
  events: {
    "click": "clicked"
  },
  
  render: function() {
    $(this.el).html(this.model.name());
    return this;
  },
  
  clicked: function() {
    this.model.run();
  }
});

var EligibleActionsView = Backbone.View.extend({
  
  tagName: "ul",
  className: "choices",
  
  initialize: function() {
    this.model.bind("action", this.render, this);
  },
  
  render: function() {
    $(this.el).empty();

    _.each(this.model.eligibleActions(), function(action) {

      var actionView = new ActionView({model: action});
      var listItem = $('<li></li>').append(actionView.render().el);
      $(this.el).append(listItem);

    }, this);

    return this;
  }
});

var PastChoicesView = Backbone.View.extend({

  tagName: "ul",
  className: "pastChoices",
  
  initialize: function() {
    this.model.bind("action", this.render, this);
  },
  
  render: function() {
    $(this.el).empty();
    
    _.each(this.model.pastChoices(), function(choice) {
      $(this.el).append("<li>" + choice + "</li>");
    }, this);
    
    return this;
  }
  
});

var PlaythroughView = Backbone.View.extend({
  
  tagName: "div",
  className: "playthrough",

  initialize: function() {
    this.eligibleActionsView = new EligibleActionsView({ 
      model: this.model,
      el: this.$('.choices')
    });
    this.pastChoicesView = new PastChoicesView({ 
      model: this.model,
      el: this.$('.pastChoices')
    });
  },
  
  render: function() {
    this.eligibleActionsView.render();
    this.pastChoicesView.render();
    
    return this;
  }
  
});