// Array.isArray fix for older Firefoxes (suggested by https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray)
if(!Array.isArray) {
	Array.isArray = function (arg) {  
		return Object.prototype.toString.call(arg) == '[object Array]';  
	};  
}

function TraverseCore() {
	this.ActionTable = {};
	this.ChoiceResults = {};
	this.HL = new TraverseHL(this);
	this.DSL = new TraverseDSL(this);
}

with ( TraverseCore.prototype )
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
			{
				if ( this.Results[i][1]() )
					this.Results[i][0]();
			}
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
			[ function() { ChoiceResults[name] = true; }, function(){return true;} ]
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

function TraverseHL(core) {
	this.Core = core;
}

with ( TraverseHL.prototype )
{
	CreateChoice = function( name, actionInitializers, predicates, additionalResults )
	{
		var createdActions = [];
		for ( var i in actionInitializers )
		{
			var fullName = actionInitializers[i].Name;
			var specificPredicates = actionInitializers[i].Predicates;
			specificPredicates = Array.isArray( specificPredicates ) ? specificPredicates : [];
			createdActions.push( new this.Core.Action( fullName, actionInitializers[i].Results.concat( GetChoiceSetter( name, fullName ) ).concat( additionalResults ), specificPredicates.concat( predicates ).concat( GetChoicePredicates( name ) ) ) );
		}
		return createdActions;
	};
	GetChoiceSetter = function( name, fullName )
	{
		return this.Core.GetOnceSetter( name ).concat( this.Core.GetOnceSetter( fullName ) );
	};
	GetChoicePredicates = function( name )
	{
		return [ this.Core.ChoiceNotMade( name ) ];
	};
}

function TraverseDSL(core) {
	this.Core = core;
}

with ( TraverseDSL.prototype )
{
	Option = function( name, optionalPredicate )
	{
		var optionalResults = Array.prototype.slice.call(arguments).slice( 2 );
		var predicates = typeof(optionalPredicate == 'function') ? [ optionalPredicate ] : [];
		return { "Name":name, "Results":optionalResults, "Predicates":predicates };
	};
	Options = function() {
		var result = [];
		var myOptions;
		if ( Array.isArray( arguments[0] ) )
			myOptions = arguments[0];
		else
			myOptions = Array.prototype.slice.call(arguments);
		for ( var i = 0 ; i < myOptions.length ; i++ )
			if ( typeof( myOptions[i] ) == 'string' )
				result.push( { "Name":myOptions[i], "Results":[], "Predicates":[] } );
			else
				result.push( myOptions[i] );
		return result;
	};
	OnlyIf = function( p )
	{
		if ( typeof(p) == 'string' )
			return this.Core.ChoiceMade( p );
		return p;
	};
	AndThen = function( r, maybePredicate )
	{
		if ( Array.isArray( r ) )
			return r;
		var result = ( typeof(r) == 'string' ) ? this.Core.GetOnceSetter( r )[0] : r;
		if ( maybePredicate != undefined && maybePredicate != null )
			result = [ result, OnlyIf( maybePredicate ) ];
		else
			result = [ result, function(){return true;} ];
		return result;
	};
	Choice = function( name ) {
		var results = [];
		var myArgs = Array.prototype.slice.call(arguments).slice(1);
		while ( Array.isArray( myArgs[ myArgs.length - 1 ] ) )
			results.push( myArgs.pop() );

		return this.Core.HL.CreateChoice( name, Options( myArgs ), [], results );
	};
	After = function( maybePredicate, maybeActions, maybeResult )
	{
		var p = OnlyIf( maybePredicate );
		var as = Array.isArray( maybeActions ) ? maybeActions : [ maybeActions ];
		var r = AndThen( maybeResult );
		for ( var i in as )
		{
			as[i].AddPredicate( p );
			if ( maybeResult != undefined && maybeResult != null )
				as[i].AddResult( r );
		}
	}
	AnyOf = function()
	{
		var predicates = arguments;
		return function()
		{
			for ( var i = 0; i < predicates.length; i++ )
				if ( OnlyIf( predicates[ i ] )() )
					return true;
			return false;
		};
	}
	EitherOf = AnyOf;
	
	AllOf = function()
	{
		var predicates = Array.prototype.slice.call( arguments );
		return function()
		{
			for ( var i = 0; i < predicates.length ; i++ )
				if ( !OnlyIf( predicates[ i ] )() )
					return false;
			return true;
		};
	}
	BothOf = AllOf;	
};