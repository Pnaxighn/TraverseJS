var actBreak = function() {
  var changes = "";

  with (TraverseCore) {      
    if ( ChoiceMade("Barbara Marries William")() ) {
      if ( ChoiceMade("They Stay Together")() ) {
        changes += "\nBarbara and William are divorced";
      }
      if ( ChoiceMade("Virginia Moves In With the Couple") ) {
        changes += "\nBarbara and William put Virginia in a nursing home";
      }
    } else {
      if ( ChoiceMade("They Divorce")() ) {
        changes += "\nBarbara and Charles are still together";
      }
      if ( ChoiceMade("Barbara Cheats")() && ChoiceMade("Charles Cheats")() ) {
        changes += "\nBarbara did not cheat on Charles, but he cheated on her";
        if ( ChoiceMade("They Put Virginia In a Nursing Home") ) {
          changes += "\nVirginia moved in with Barbara and Charles";
        }
      } else if ( !(ChoiceMade("Barbara Cheats")()) && !(ChoiceMade("Charles Cheats")()) ) {
        changes += "\nBarbara cheated on Charles, but he remained faithful to her";
        if ( ChoiceMade("Virginia Moves In With the Couple") ) {
          changes += "\nBarbara and Charles put Virginia in a nursing home";
        }
      }
    }
    
    if (changes != "") {
      alert("Some chapters are missing from the second half of the book!  You sense that things are different:\n"+changes);
    }
  }
}

var GameState = { scene: 1, act: 1 };

function SetScene(newAct, newScene) {
  return function() {
    GameState.act = newAct;
    GameState.scene = newScene;
  };
}
  
// Game rules
with ( TraverseDSL ) {
  Choice( "Barbara Marries Somebody", "Barbara Marries Charles", "Barbara Marries William",
    AndThen(SetScene(1, 2)));

  After( "Barbara Marries Somebody",
    Choice( "Barbara Chooses Whether to Cheat", "Barbara Cheats", "Barbara Doesn't Cheat" ),
    AndThen(SetScene(1, 3), OnlyIf(EitherOf("Barbara Marries William", "Charles Chooses Whether to Cheat"))));
  After( "Barbara Marries Charles",
    Choice( "Charles Chooses Whether to Cheat", "Charles Cheats", "Charles Doesn't Cheat" ),
    AndThen(SetScene(1, 3), OnlyIf("Barbara Chooses Whether to Cheat")));
    
  After( 
    BothOf( 
      "Barbara Chooses Whether to Cheat", 
      EitherOf( "Barbara Marries William", "Charles Chooses Whether to Cheat" )
    ),
    Choice( "They Choose Whether to Divorce", "They Divorce", "They Stay Together" ),
    AndThen(SetScene(1, 4)));

  After( "They Choose Whether to Divorce",    
    Choice( "They Decide What to Do With Virginia", "Virginia Moves In With the Couple", "They Put Virginia in a Nursing Home" ),
    AndThen( actBreak, SetScene(2, 1) ));
  
  After( BothOf( "They Decide What to Do With Virginia", "Barbara Marries William" ),
    Choice( "Charles Decides Whether to Lend Barbara Money", "Charles Lends Her Money", "Charles Doesn't Lend Her Money" ),
    AndThen(SetScene(2, 2)));
  After( AllOf( "They Decide What to Do With Virginia", "Barbara Marries Charles", "They Divorce" ),
    Choice( "William Decides Whether to Lend Barbara Money", "William Lends Her Money", "William Doesn't Lend Her Money" ),
    AndThen(SetScene(2, 2)));
  After( AllOf( "They Decide What to Do With Virginia", "Barbara Marries Charles", "They Stay Together" ),
    Choice( "William Decides Whether to Lend Them Money", "William Lends Them Money", "William Doesn't Lend Them Money" ),
    AndThen(SetScene(2, 2)));

  After( AnyOf( "Charles Decides Whether to Lend Barbara Money", 
                "William Decides Whether to Lend Barbara Money",
                "William Decides Whether to Lend Them Money" ),
         Choice( "They Decide Where to Send Stephanie", "They Send Stephanie to Rehab", "They Send Stephanie to Jail" ),
         AndThen(SetScene(2, 3)));

  After( "They Decide Where to Send Stephanie",
    Choice( "They Meet Jason", "They Accept Jason", "They Reject Jason" ),
    AndThen(SetScene(2, 4)));
      
  After( "They Meet Jason",
    Choice( "Jason and Stephanie Decide What to Do With Their Parents",
      "They Leave Their Parents to Fend for Themselves",
      "They Support Their Parents Financially",
      Option("They Support Barbara Financially", OnlyIf("They Divorce")),
      Option("They Support William Financially", OnlyIf(BothOf("Barbara Marries William", "They Divorce"))),
      Option("They Support Charles Financially", OnlyIf(BothOf("Barbara Marries Charles", "They Divorce"))),
      
      Option("They Allow Their Parents to Move In With Them", OnlyIf("They Stay Together")),
      Option("They Allow Barbara to Move In With Them", OnlyIf("They Divorce")),
      Option("They Allow William to Move In With Them", OnlyIf(BothOf("Barbara Marries William", "They Divorce"))),
      Option("They Allow Charles to Move In With Them", OnlyIf(BothOf("Barbara Marries Charles", "They Divorce"))),
      
      Option("They Put Their Parents in a Nursing Home", OnlyIf("They Stay Together")),
      Option("They Put Their Parents in Separate Nursing Homes", OnlyIf("They Divorce")),
      Option("They Put Barbara in a Nursing Home", OnlyIf("They Divorce")),
      Option("They Put William in a Nursing Home", OnlyIf(BothOf("Barbara Marries William", "They Divorce"))),
      Option("They Put Charles in a Nursing Home", OnlyIf(BothOf("Barbara Marries Charles", "They Divorce")))
      ));
}

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
  initialize: function() {
    // this is where init code will go once we can support multiple playthroughs
  },
  
  pastChoices: function() {
    return _.keys(TraverseCore.ChoiceResults).filter(function (choice) {
      // only return ones that are true in the results table
      return TraverseCore.ChoiceResults[choice];
    });
  },
  
  eligibleActions: function() {
    return _.map(TraverseCore.GetAllEligibleActions(),
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

var SceneCounterView = Backbone.View.extend({

  tagName: "div",
  className: "sceneCounter",
  
  initialize: function() {
    this.model.bind("action", this.render, this);
  },
  
  render: function() {
    $(this.el).html("Act " + GameState.act + ", Scene " + GameState.scene);
  }
});

var PlaythroughView = Backbone.View.extend({
  
  tagName: "div",
  className: "playthrough",

  initialize: function() {
    this.sceneCounterView = new SceneCounterView({ 
      model: this.model,
      el: this.$('.sceneCounter')
    });
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
    var subviews = [this.sceneCounterView, this.eligibleActionsView, this.pastChoicesView];
    _.each(subviews, function(subview) { subview.render(); });
    
    return this;
  }
  
});

$(function() {
  var playthrough = new Playthrough();
  $('.playthrough').each(function() {
    var playthrough = new Playthrough();
    new PlaythroughView({ model: playthrough, el: this }).render();
  });
});
