import Repo from "./repo";

class Thread {
    constructor (private _github: any, private _url: string) /* : Promise<Thread> */ {
        let issueMatch = /api.github.com\/repos\/([\-\w]+)\/([\-\w]+)\/issues\/(\d+)/.exec(_url);
        if (!issueMatch) {
            throw new Error(`Received issue notification that didn't match regex: ${_url}`);
        }

        this.repo = new Repo(issueMatch[1], issueMatch[2]);
        this.id = parseInt(issueMatch[3], 10);

        // Note that this constructor returns a *promise*, not an instance
        return <any> <Promise<Thread>> this._github.issues.getComments({
            user: this.repo.user,
            repo: this.repo.name,
            number: this.id
        }).then((comments) => {
            this.comments = comments;
            return this;
        });
    }

    public repo: Repo;
    public id: number;
    public comments: any[];

    async comment(message: string): Promise<void> {
        return this._github.issues.createComment({
            user: this.repo.user,
            repo: this.repo.name,
            number: this.id,
            body: message
        });
    }
}

interface Thread {
    new (github: any, url: string): Promise<Thread>;
}

export default Thread;
