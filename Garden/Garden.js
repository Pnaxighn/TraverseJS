with (TraverseCore) {
  
}

Choice( "Barbara gets married" : {
  "to William"
  "to Charles"
} );

After( "Barbara gets married" : {
  Choice( "Barbara chooses" {
    "to cheat"
    "not to cheat"
  } )
} );

After("to Charles",{
  Choice( "Charles chooses" {
    "to cheat"
    "not to cheat"
  } )
} );