import { Application } from '../declarations';
import profiles from './profiles/profiles.service';
// Don't remove this comment. It's needed to format import lines nicely.
import users from './users/users.service';
import friends from './friends/friends.service';
import auth from './auth/auth.service';
import email from './email/email.service';
import connections from './connections/connections.service';
import accounts from './accounts/accounts.service';
import location from './location/location.service';
import domains from './domains/domains.service';
import mediaServices from './media/services';

import place from './place/place.service';

import current from './current/current.service';

export default function (app: Application): void {
    app.configure(auth);
    app.configure(users);
    app.configure(friends);
    app.configure(profiles);
    app.configure(accounts);
    app.configure(email);
    app.configure(connections);
    app.configure(location);
    app.configure(domains);
    app.configure(place);
    app.configure(current);
    mediaServices.forEach((service)=>{
        app.configure(service);
    });
}
