'use strict';

export class RequestType {
    public static HANDSHAKE = 'handshake';      // doing handshake to make a connection
    public static CONNECTION = 'connection';    // asking to make a connection
    public static FRIEND = 'friend';            // asking to be a friend
    public static FOLLOW = 'follow';            // asking to follow
    public static VERIFYEMAIL = 'verifyEmail';  // verifying email request
}
