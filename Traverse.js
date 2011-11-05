var TraverseCore = {
	ActionTable:{},
	ChoiceResults:{},
	Action:function( name, results, predicates )
	{
		this.Name = name;
		this.Results = results;
		this.Predicates = predicates;
		TraverseCore.ActionTable[name] = this;
	},
	Action_Run:function()
	{
		if ( this.IsEligible() )
			for ( var i in this.Results )
				this.Results[i]();
		else
			throw "Can't run " + this.Name;
	},
	Action_IsEligible:function()
	{
		var OK = true;
		if ( this.Predicates != null )
			for ( var i in this.Predicates )
				OK = OK && this.Predicates[i]();
		return OK;
	},
	ResolveAction:function(nameOrAction)
	{
		if ( typeof( nameOrAction ) == 'string' )
			return TraverseCore.ActionTable[nameOrAction];
		return nameOrAction;
	},
	CreateChoice:function( name, actionInitializers, predicates )
	{
		for ( var i in actionInitializers )
		{
			var fullName = name + " " + actionInitializers[i].Name;
			new TraverseCore.Action( fullName, actionInitializers[i].Results.concat( TraverseCore.GetChoiceSetter( name, fullName ) ), predicates.concat( TraverseCore.GetChoicePredicates( name ) ) );
		}
	},
	GetChoiceSetter:function( name, fullName )
	{
		return [
			function() { TraverseCore.ChoiceResults[name] = true; },
			function() { TraverseCore.ChoiceResults[fullName] = true; }
		];
	},
	GetChoicePredicates:function( name )
	{
		return [ TraverseCore.ChoiceNotMade( name ) ];
	},
	ChoiceMade:function( name )
	{
		return function(){ return TraverseCore.ChoiceResults[name]; };
	},
	ChoiceNotMade:function( name )
	{
		return function(){ return !TraverseCore.ChoiceResults[name]; };
	}
};

with ( TraverseCore )
{
	Action.prototype.Run = Action_Run;
	Action.prototype.IsEligible = Action_IsEligible;
}