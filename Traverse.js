var TraverseCore = {
	ActionTable:{},
	ChoiceResults:{},
	Action:null,
	Action_Run:null,
	Action_IsEligible:null,
	Action_AddResult:null,
	Action_AddPredicate:null,
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
	Action_AddResult = function( f )
	{
		this.Results.push( f );
	};
	Action_AddPredicate = function ( f )
	{
		this.Predicates.push( f );
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
	Action.prototype.AddResult = Action_AddResult;
	Action.prototype.AddPredicate = Action_AddPredicate;
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
		var results = [];
		for ( var i in actionInitializers )
		{
			var fullName = actionInitializers[i].Name;
			results.push( new TraverseCore.Action( fullName, actionInitializers[i].Results.concat( GetChoiceSetter( name, fullName ) ), predicates.concat( GetChoicePredicates( name ) ) ) );
		}
		return results;
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
	Choice:null,
	After:null,
	Options:null,
	ResolvePredicate:null,
	AndThen:null
};

with ( TraverseDSL )
{
	Options = function() {
		var result = [];
		for ( var i = 0 ; i < arguments.length ; i++ )
			if ( typeof( arguments[i] ) == 'string' )
				result.push( { "Name":arguments[i], "Results":[] } );
			else
				result.push( arguments[i] );
	};
	ResolvePredicate = function( p )
	{
		if ( typeof(p) == 'string' )
			return TraverseCore.ChoiceMade( p );
		return p;
	};
	AndThen = function ( r )
	{
		if ( typeof(r) == 'string' )
			return TraverseCore.GetOnceSetter( r )[0];
		return r;
	};
	Choice = function( name ) {
		var results = [];
		var myArgs = arguments.slice(1);
		while ( typeof( myArgs[ myArgs.length - 1 ] ) == 'function' )
			results.push( myArgs.pop() );

		return CreateChoice( name, Options( myArgs ), results );
	};
	After = function( maybePredicate, maybeActions, maybeResult )
	{
		var p = ResolvePredicate( maybePredicate );
		var as = Array.isArray( maybeActions ) ? maybeActions : [ maybeActions ];
		var r = AndThen( maybeResult );
		for ( var i in as )
		{
			as[i].AddPredicate( p );
			if ( r != null )
				as[i].AddResult( r );
		}
	}
};