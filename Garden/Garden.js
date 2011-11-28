var GardenCore;
GardenCore.prototype = new TraverseCore;

_.extend(GardenCore.prototype, {
  SetScene: function(newAct, newScene) {
    var core = this;
    
    return function() {
      core.act = newAct;
      core.scene = newScene;
    }
  },
  
  ActBreak: function() {
    var changes = "";
  
    if ( this.ChoiceMade("Barbara Marries William")() ) {
      if ( this.ChoiceMade("They Stay Together")() ) {
        changes += "\nBarbara and William are divorced";
      }
      if ( this.ChoiceMade("Virginia Moves In With the Couple") ) {
        changes += "\nBarbara and William put Virginia in a nursing home";
      }
    } else {
      if ( this.ChoiceMade("They Divorce")() ) {
        changes += "\nBarbara and Charles are still together";
      }
      if ( this.ChoiceMade("Barbara Cheats")() && this.ChoiceMade("Charles Cheats")() ) {
        changes += "\nBarbara did not cheat on Charles, but he cheated on her";
        if ( this.ChoiceMade("They Put Virginia In a Nursing Home") ) {
          changes += "\nVirginia moved in with Barbara and Charles";
        }
      } else if ( !(this.ChoiceMade("Barbara Cheats")()) && !(this.ChoiceMade("Charles Cheats")()) ) {
        changes += "\nBarbara cheated on Charles, but he remained faithful to her";
        if ( this.ChoiceMade("Virginia Moves In With the Couple") ) {
          changes += "\nBarbara and Charles put Virginia in a nursing home";
        }
      }
    }
    
    if (changes != "") {
      alert("Some chapters are missing from the second half of the book!  You sense that things are different:\n"+changes);
    }
  }
});

function GardenCore() {
  TraverseCore.call(this);
  
  this.scene = 1;
  this.act = 1;
  
  with (this.DSL) {
    Choice( "Barbara Marries Somebody", "Barbara Marries Charles", "Barbara Marries William",
      AndThen(this.SetScene(1, 2)));
  
    After( "Barbara Marries Somebody",
      Choice( "Barbara Chooses Whether to Cheat", "Barbara Cheats", "Barbara Doesn't Cheat" ),
      AndThen(this.SetScene(1, 3), OnlyIf(EitherOf("Barbara Marries William", "Charles Chooses Whether to Cheat"))));
    After( "Barbara Marries Charles",
      Choice( "Charles Chooses Whether to Cheat", "Charles Cheats", "Charles Doesn't Cheat" ),
      AndThen(this.SetScene(1, 3), OnlyIf("Barbara Chooses Whether to Cheat")));
      
    After( 
      BothOf( 
        "Barbara Chooses Whether to Cheat", 
        EitherOf( "Barbara Marries William", "Charles Chooses Whether to Cheat" )
      ),
      Choice( "They Choose Whether to Divorce", "They Divorce", "They Stay Together" ),
      AndThen(this.SetScene(1, 4)));
  
    After( "They Choose Whether to Divorce",    
      Choice( "They Decide What to Do With Virginia", "Virginia Moves In With the Couple", "They Put Virginia in a Nursing Home" ),
      AndThen( this.ActBreak, this.SetScene(2, 1) ));
    
    After( BothOf( "They Decide What to Do With Virginia", "Barbara Marries William" ),
      Choice( "Charles Decides Whether to Lend Barbara Money", "Charles Lends Her Money", "Charles Doesn't Lend Her Money" ),
      AndThen(this.SetScene(2, 2)));
    After( AllOf( "They Decide What to Do With Virginia", "Barbara Marries Charles", "They Divorce" ),
      Choice( "William Decides Whether to Lend Barbara Money", "William Lends Her Money", "William Doesn't Lend Her Money" ),
      AndThen(this.SetScene(2, 2)));
    After( AllOf( "They Decide What to Do With Virginia", "Barbara Marries Charles", "They Stay Together" ),
      Choice( "William Decides Whether to Lend Them Money", "William Lends Them Money", "William Doesn't Lend Them Money" ),
      AndThen(this.SetScene(2, 2)));
  
    After( AnyOf( "Charles Decides Whether to Lend Barbara Money", 
                  "William Decides Whether to Lend Barbara Money",
                  "William Decides Whether to Lend Them Money" ),
           Choice( "They Decide Where to Send Stephanie", "They Send Stephanie to Rehab", "They Send Stephanie to Jail" ),
           AndThen(this.SetScene(2, 3)));
  
    After( "They Decide Where to Send Stephanie",
      Choice( "They Meet Jason", "They Accept Jason", "They Reject Jason" ),
      AndThen(this.SetScene(2, 4)));
        
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
}

var GardenPlaythrough = Playthrough.extend({
  getAct: function() {
    return this.core.act;
  },
  
  getScene: function() {
    return this.core.scene;
  }
});

var SceneCounterView = Backbone.View.extend({

  tagName: "div",
  className: "sceneCounter",
  
  initialize: function() {
    this.model.bind("action", this.render, this);
  },
  
  render: function() {
    $(this.el).html("Act " + this.model.getAct() + ", Scene " + this.model.getScene());
  }
});

var GardenPlaythroughView = PlaythroughView.extend({
  
  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, [options]);
    
    this.sceneCounterView = new SceneCounterView({ 
      model: this.model,
      el: this.$('.sceneCounter')
    });
  },
  
  render: function() {
    this.sceneCounterView.render();
    return this.constructor.__super__.render.apply(this, []);
  }
  
});

$(function() {
  $('.playthrough').each(function() {
    var playthrough = new GardenPlaythrough(new GardenCore());
    new GardenPlaythroughView({ model: playthrough, el: this }).render();
  });
});