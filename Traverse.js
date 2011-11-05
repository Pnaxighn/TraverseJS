var TraverseCore = {
	ActionTable:{},
	ChoiceResults:{},
	Action:null,
	Action_Run:null,
	Action_IsEligible:null,
	ResolveAction:null,
	GetOnceSetter:null,
	ChoiceMade:null,
	ChoiceNotMade:null,
	GetAllEligibleActions:null,
	GetOnceAction:null
};
with ( TraverseCore )
{
	Action = function( name, results, predicates )
	{
		this.Name = name;
		this.Results = results;
		this.Predicates = predicates;
		ActionTable[name] = this;
	};
	Action_Run = function()
	{
		if ( this.IsEligible() )
			for ( var i in this.Results )
				this.Results[i]();
		else
			throw "Can't run " + this.Name;
	};
	Action_IsEligible = function()
	{
		var OK = true;
		if ( this.Predicates != null )
			for ( var i in this.Predicates )
				OK = OK && this.Predicates[i]();
		return OK;
	};
	ResolveAction = function(nameOrAction)
	{
		if ( typeof( nameOrAction ) == 'string' )
			return ActionTable[nameOrAction];
		return nameOrAction;
	};
	GetOnceSetter = function( name )
	{
		ChoiceResults[name] = false;
		return [
			function() { ChoiceResults[name] = true; }
		];
	};
	ChoiceMade = function( name )
	{
		return function(){ return ChoiceResults[name]; };
	};
	ChoiceNotMade = function( name )
	{
		return function(){ return !ChoiceResults[name]; };
	};
	GetAllEligibleActions = function()
	{
		var result = [];
		for ( var actName in ActionTable )
		{
			var act = ResolveAction( actName );
			if ( act.IsEligible() )
				result.push( act );
		}
		return result;
	};
	GetOnceAction = function( name, results, predicates )
	{
		new Action( name, results.concat( GetOnceSetter( name ) ), predicates.concat( ChoiceNotMade( name ) ) );
	};
	Action.prototype.Run = Action_Run;
	Action.prototype.IsEligible = Action_IsEligible;
}

var TraverseHL = {
	CreateChoice:null,
	GetChoiceSetter:null,
	GetChoicePredicates:null,
};

with ( TraverseHL )
{
	CreateChoice = function( name, actionInitializers, predicates )
	{
		for ( var i in actionInitializers )
		{
			var fullName = actionInitializers[i].Name;
			new TraverseCore.Action( fullName, actionInitializers[i].Results.concat( GetChoiceSetter( name, fullName ) ), predicates.concat( GetChoicePredicates( name ) ) );
		}
	};
	GetChoiceSetter = function( name, fullName )
	{
		return TraverseCore.GetOnceSetter( name ).concat( TraverseCore.GetOnceSetter( fullName ) );
	};
	GetChoicePredicates = function( name )
	{
		return [ TraverseCore.ChoiceNotMade( name ) ];
	};
}

var TraverseDSL = {

};

