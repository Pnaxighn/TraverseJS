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
  
// Game rules
with ( TraverseDSL ) {
  Choice( "Barbara Marries Somebody", "Barbara Marries Charles", "Barbara Marries William" );

  After( "Barbara Marries Somebody",
    Choice( "Barbara Chooses Whether to Cheat", "Barbara Cheats", "Barbara Doesn't Cheat" ));
  After( "Barbara Marries Charles",
    Choice( "Charles Chooses Whether to Cheat", "Charles Cheats", "Charles Doesn't Cheat" ));
    
  After( 
    BothOf( 
      "Barbara Chooses Whether to Cheat", 
      EitherOf( "Barbara Marries William", "Charles Chooses Whether to Cheat" )
    ),
    Choice( "They Choose Whether to Divorce", "They Divorce", "They Stay Together" ));

  After( "They Choose Whether to Divorce",    
    Choice( "They Decide What to Do With Virginia", "Virginia Moves In With the Couple", "They Put Virginia in a Nursing Home" ),
    AndThen( actBreak ));
  
  After( BothOf( "They Decide What to Do With Virginia", "Barbara Marries William" ),
    Choice( "Charles Decides Whether to Lend Barbara Money", "Charles Lends Her Money", "Charles Doesn't Lend Her Money" ));
  After( AllOf( "They Decide What to Do With Virginia", "Barbara Marries Charles", "They Divorce" ),
    Choice( "William Decides Whether to Lend Barbara Money", "William Lends Her Money", "William Doesn't Lend Her Money" ));
  After( AllOf( "They Decide What to Do With Virginia", "Barbara Marries Charles", "They Stay Together" ),
    Choice( "William Decides Whether to Lend Them Money", "William Lends Them Money", "William Doesn't Lend Them Money" ));

  After( AnyOf( "Charles Decides Whether to Lend Barbara Money", 
                "William Decides Whether to Lend Barbara Money",
                "William Decides Whether to Lend Them Money" ),
         Choice( "They Decide Where to Send Stephanie", "They Send Stephanie to Rehab", "They Send Stephanie to Jail" ));

  After( "They Decide Where to Send Stephanie",
    Choice( "They Meet Jason", "They Accept Jason", "They Reject Jason" ));
      
/*  After( "They Meet Jason",
    Choice( "Jason and Stephanie Decide What to Do With Their Parents",
      "They Leave Their Parents to Fend for Themselves",
      "They Support Their Parents Financially",
      Option("They Support Barbara Financially", OnlyIf("They Divorce")),
      Option("They Support William Financially", OnlyIf(BothOf("Barbara Marries William", "They Divorce")),
      Option("They Support Charles Financially", OnlyIf(BothOf("Barbara Marries Charles", "They Divorce")),
      
      Option("They Allow Their Parents to Move In With Them", OnlyIf("They Stay Together")),
      Option("They Allow Barbara to Move In With Them", OnlyIf("They Divorce")),
      Option("They Allow William to Move In With Them", OnlyIf(BothOf("Barbara Marries William", "They Divorce")),
      Option("They Allow Charles to Move In With Them", OnlyIf(BothOf("Barbara Marries Charles", "They Divorce")),
      
      Option("They Put Their Parents in a Nursing Home", OnlyIf("They Stay Together")),
      Option("They Put Their Parents in Separate Nursing Homes", OnlyIf("They Divorce")),
      Option("They Put Barbara in a Nursing Home", OnlyIf("They Divorce")),
      Option("They Put William in a Nursing Home", OnlyIf(BothOf("Barbara Marries William", "They Divorce")),
      Option("They Put Charles in a Nursing Home", OnlyIf(BothOf("Barbara Marries Charles", "They Divorce")),
              
      ));*/
}

var Playthrough = Backbone.Model.extend({
  initialize: function() {
    // this is where init code will go once we can support multiple playthroughs
  },
  
  pastChoices: function() {
    return _.values(TraverseCore.ChoiceResults);
  },
  
  eligibleActions: function() {
    return _.values(TraverseCore.GetAllEligibleActions());
  }
});




		
var renderPastChoices = function() {
  var $pastChoices = $('#pastChoices');
  $pastChoices.empty();
  
  with (TraverseCore) {
    for (var choice in ChoiceResults) {
      if (ChoiceResults[choice]) {
        $pastChoices.append("<li>" + choice + "</li>");
      }
    }
  }
}

var getActionButtonClicked = function(action) {
  return function() {
    action.Run(); 
    renderActionList();
    renderPastChoices();
  };
};

var renderActionList = function() {
  with (TraverseCore) {
    var $choices = $('#choices');
    $choices.empty();
    var avail = GetAllEligibleActions();
    for (var i in avail) {
      var action = avail[i];
      
      var $actionButton = $('<button>' + action.Name + '</button>');
      $actionButton.bind('click', getActionButtonClicked(action));
      
      var $listItem = $('<li></li>').append($actionButton);
      $choices.append($listItem);
    }
  }
}

$(function() {
  renderActionList();
});
