module.exports = class mongodb {

    constructor(config) {
        this.db_url = 'mongodb://' + config.host + ':' + config.port.toString() + '/' + config.db;
        this.mongo_client = require('mongodb').MongoClient;
        this.assert = require('assert');
    }

    register(user, fn) {
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection("user").findOne(user, (err, res) => {
                this.assert.equal(err, null);
                if (res) {
                    fn(false);
                    cli.close();
                } else {
                    user.friends = [];
                    user.avatar = null;
                    var temp={username:user.username,friends:[]};
                    cli.db().collection("user_store").insertOne(temp,(err,res)=>{
                        this.assert.equal(err,null);

                });
                    cli.db().collection("user").insertOne(user, (err, res) => {
                        this.assert.equal(err, null);
                    fn(res !== null);
                    cli.close();
                });
                }
            });
        });
    }

    login(user, fn) {
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection("user").findOne(user, (err, res) => {
                this.assert.equal(err, null);
                fn(res !== null);
                cli.close();
            });
        });
    }

    get_userinfo(username, fn) {
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection("user").findOne(username, (err, res) => {
                this.assert.equal(err, null);
                fn(res);
                cli.close();
            });
        });
    }
    
    get_user_to_avatar(fn){
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection("user").find({}).toArray((err, userlist)=>{
                this.assert.equal(err, null);
                fn(userlist);
            });
        });
    }

    get_chat_history(from, to, fn) {
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            let chatting_room = [from, to];
            cli.db().collection("chat").findOne({members: chatting_room}, (err, res) => {
                this.assert.equal(err, null);
                fn(res);
                cli.close();
            });
        });
    }

    get_group_chat_history(groupid, fn){
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection("groupchat").findOne(groupid, (err, res) => {
                this.assert.equal(err, null);
                fn(res);
                cli.close();
            });
        });
    }

    get_history(from, to, fn) {
        this.mongo_client.connect(this.db_url, function (err, client) {
            let dbo = client.db('db_chat');
            dbo.collection("user_info").findOne({account: from}, (err, res) => {
                this.assert.equal(err, null);
                let friends = res.friends;
                let result = friends.find(function (element) {
                    return element.account === to;
                });

                if (result !== undefined) {
                    dbo.collection("chat_info").findOne({chat_id: result.chat_id}, function (err, record) {
                        let history = record.history;
                        fn(history);
                        client.close();
                    });
                }
            });
        });
    }

    append_chat_history(data) {
        this.mongo_client.connect(this.db_url, (err, client) => {
            this.assert.equal(err, null);
            let sender = data.sender;
            let target = data.target;
            let id1 = sender < target ? sender : target;
            let id2 = sender < target ? target : sender;
            client.db().collection('chat').updateOne(
                {members: [id1, id2]},
                {$push: {messages: data.message}},
                {upsert: true}, (err, res) => {
                    this.assert.equal(err, null);

                });
        })
    }

    append_group_chat_history(data) {
        this.mongo_client.connect(this.db_url, (err, client) => {
            this.assert.equal(err, null);
            let groupid = data.target;
            client.db().collection('groupchat').updateOne(
                {groupid: groupid},
                {$push: {messages: data.message}},
                {upsert: true}, (err, res) => {
                    this.assert.equal(err, null);

                });
        })
    }

    check_image_md5(md5, fn) {
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection('image').findOne(md5, (err, res) => {
                this.assert.equal(err, null);
                //console.log(res);
                fn(res);
                cli.close();
            });
        });
    }

    upload_image(image, fn) {
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection('image').insertOne(image, (err, res) => {
                this.assert.equal(err, null);
                fn(res !== null);
                cli.close();
            });
        });
    }

    change_avatar(user, md5, suffix, fn) {
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection('image').findOne({md5: md5}, (err, res) => {
                this.assert.equal(err, null);
                if (res === null) {
                    fn(null);
                    cli.close();
                    return;
                }
                cli.db().collection('user').updateOne({username: user}, {$set: {avatar: md5 + '.' + suffix}}, (err, res) => {
                    this.assert.equal(err, null);
                    fn(true);
                    cli.close();
                });
            });
        });
    }

    get_group_info(groupid, fn){
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection('groupchat').findOne({groupid: groupid}, (err, res) => {
                fn(res);
            });
        });
    }

    get_avatar(username, fn) {
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection('user').findOne({username: username}, (err, res) => {
                let md5 = res.avatar;
                if (md5 === null) {
                    fn(null);
                    cli.close();
                    return;
                }
                cli.db().collection('image').findOne({md5: md5}, (err, res) => {
                    this.assert.equal(err, null);
                    if (res == null) {
                        fn(null);
                        cli.close();
                        return;
                    }
                    fn(res.md5 + '.' + res.suffix);
                    cli.close();
                    return;
                });
            });
        });
    }
//获取待加好友列表
    get_user_store(username,fn){
        this.mongo_client.connect(this.db_url,(err,cli)=>{
            this.assert.equal(err,null);

        cli.db().collection('user_store').findOne({username:username},(err,res)=>{
            this.assert.equal(err,null);


        fn(res.friends);
        cli.close();
        return;
    });
    });
    }
    //添加待加好友
    appand_friend_store(username,friendname,fn){
        this.mongo_client.connect(this.db_url,(err,cli)=>{
            this.assert.equal(err,null);
        cli.db().collection('user').findOne({username:friendname},(err,res)=>{
            this.assert.equal(err,null);
        if(res===null){
            fn(null);
            cli.close();
            return;
        }
        else{
            cli.db().collection('user').findOne({username:username},(err,res)=>{
                this.assert.equal(err,null);
            let count=0;
            for(let index=0;index<res.friends.length;++index){
                if(res.friends[index]===friendname){
                    count=count+1;
                    break;
                }
            }
            if(count===0)
            {
                cli.db().collection('user_store').findOne({username:friendname},(err,res)=>{
                    this.assert.equal(err,null);
                let sum=0;
                for(let index=0;index<res.friends.length;++index){
                    if(res.friends[index]===username){
                        sum=sum+1;
                        break;
                    }
                }
                if(sum===0)
                {
                    cli.db().collection('user_store').updateOne({username: friendname}, {$addToSet: {friends: username}},(err,res)=>{
                        this.assert.equal(err,null);
                    fn('success');
                    cli.close();
                    return;
                });
                }
                else
                {
                    fn('exist2');
                    cli.close();
                    return;
                }
            });
            }
            else
            {
                fn('exist1');
                cli.close();
                return;
            }
        });
        }

    });
    });
    }
    //是否同意好友请求
    insert_friend(username,friendname,result,fn){
        this.mongo_client.connect(this.db_url,(err,cli)=>{
            this.assert.equal(err,null);
        cli.db().collection('user_store').findOne({username:username}, (err, res) => {
            this.assert.equal(err, null);
        if (res!==null){
            var user_friends=res.friends;
            var index=user_friends.indexOf(friendname);
            user_friends.splice(index,1);
            console.log('username'+username);
            console.log('friendname'+friendname);
            console.log('user-friends'+user_friends);
            cli.db().collection('user_store').updateOne({username: username},{$set:{friends:user_friends}},(err, res) => {
                this.assert.equal(err, null);

        });
        }

    });
        if(result==='Yes'){
            cli.db().collection('user').updateOne({username: username}, {$addToSet: {friends: friendname}}, (err, res) => {     //为username添加好友
                this.assert.equal(err, null);
        });
            cli.db().collection('user').updateOne({username: friendname}, {$addToSet: {friends: username}}, (err, res) => {     //为friendname添加好友
                this.assert.equal(err, null);
        });
            let id1 = username < friendname ? username : friendname;
            let id2 = username < friendname ? friendname : username;
            let newchat = {
                members: [id1, id2],
                messages: []
            };
            cli.db().collection("chat").insertOne(newchat, (err, res) => {        //向chat中插入新数据
                this.assert.equal(err, null);
            fn(true);
            cli.close();
            return;
        });

        }
        else
        {
            fn(false);

            return;
        }


    });
    }
    //插入新的添加好友数据
    appand_friend(username, friendname, fn) {
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection('user').findOne({username: friendname}, (err, res) => {         //查询该好友是否存在
                this.assert.equal(err, null);
                if (res === null) {        //该账号不存在
                    fn(null);
                    cli.close();
                    return;
                }
                else {                //该好友存在，更改数据
                    cli.db().collection('user').findOne({username: username}, (err, res) => {       //查询是否已经是好友
                        this.assert.equal(err, null);
                        let count = 0;
                        for (let index = 0; index < res.friends.length; ++index) {
                            if (res.friends[index] === friendname) {
                                count = count + 1;
                                break;
                            }
                        }
                        if (count === 0) {        //还未添加好友
                            cli.db().collection('user').updateOne({username: username}, {$addToSet: {friends: friendname}}, (err, res) => {     //为username添加好友
                                this.assert.equal(err, null);
                            });
                            cli.db().collection('user').updateOne({username: friendname}, {$addToSet: {friends: username}}, (err, res) => {     //为friendname添加好友
                                this.assert.equal(err, null);
                            });
                            let id1 = username < friendname ? username : friendname;
                            let id2 = username < friendname ? friendname : username;
                            let newchat = {
                                members: [id1, id2],
                                messages: []
                            };
                            cli.db().collection("chat").insertOne(newchat, (err, res) => {        //向chat中插入新数据
                                this.assert.equal(err, null);
                                fn('success');
                                cli.close();
                                return;
                            });
                            cli.close();
                            return;
                        }
                        else {            //已加好友,不能再加
                            fn('exist');
                            cli.close();
                            return;
                        }

                    });
                }
            });

        });
    };

    //删除好友数据
    delete_friend(username,friendname,fn){
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            //  删除username中的friendname
            cli.db().collection('user').findOne({username:username}, (err, res) => {
                this.assert.equal(err, null);
                if (res!==null){
                    var user_friends=res.friends;
                    var index=user_friends.indexOf(friendname);
                    user_friends.splice(index,1);
                    console.log('username'+username);
                    console.log('friendname'+friendname);
                    console.log('user-friends'+user_friends);
                    cli.db().collection('user').updateOne({username: username},{$set:{friends:user_friends}},(err, res) => {
                        this.assert.equal(err, null);
                    });
                }
                cli.close();
            });
        });

        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            //  删除friendname中的username
            cli.db().collection('user').findOne({username: friendname},(err, res) => {
                this.assert.equal(err, null);
                if (res!==null){
                    var friend_friends=res.friends;
                    var index=friend_friends.indexOf(username);
                    friend_friends.splice(index, 1);
                    cli.db().collection('user').updateOne({username: friendname},{$set:{friends:friend_friends}},(err, res) => {
                        this.assert.equal(err, null);
                    });
                    let id1 = username < friendname ? username : friendname;
                    let id2 = username < friendname ? friendname : username;
                    var del_members=[id1,id2];
                    cli.db().collection('chat').deleteOne({members:del_members}, (err, res) => {
                        this.assert.equal(err, null);
                    });
                }
                cli.close();
            });
            var res={
                status:true,
                delFriendName:friendname
            }
            fn(res);
        });
    }

    //创建新群聊
    create_group(username, fn){
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection('groupchat').findOne({type: 'increment'}, (err, res) => {
                this.assert.equal(err, null);
                let newgroupid=res.increment;
                let newgroupchat={
                    groupid:newgroupid,
                    members:[username],
                    messages:[]
                };
                cli.db().collection('user').updateOne({username: username}, {$addToSet: {ingroup: newgroupid}}, (err, res) => {     //在user的ingroup字段添加创建的新组
                    this.assert.equal(err, null);
                });
                cli.db().collection("groupchat").insertOne(newgroupchat, (err, res) => {        //向groupchat中插入新数据
                    this.assert.equal(err, null);
                });
                newgroupid=newgroupid+1;
                cli.db().collection('groupchat').updateOne({type: 'increment'}, {$set: {increment: newgroupid}}, (err, res) => {     //自增量加一
                    this.assert.equal(err, null);
                });
                var res={
                    status:true,
                    createId:newgroupid-1
                }
                fn(res);
                cli.close();
            });
        });
    }

    //加入群聊
    join_group(username, groupid, fn){
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection('groupchat').findOne({groupid: groupid}, (err, res) => {
                this.assert.equal(err, null);
                if (res!==null){
                    cli.db().collection('groupchat').updateOne({groupid: groupid}, {$addToSet: {members: username}}, (err, res) => {     //在groupchat中插入新成员
                        this.assert.equal(err, null);
                    });
                    cli.db().collection('user').updateOne({username: username}, {$addToSet: {ingroup: groupid}}, (err, res) => {     //在user的ingroup字段添加新的组
                        this.assert.equal(err, null);
                    });
                    fn('success');
                    cli.close();
                }
                else {
                    fn(null);
                    cli.close();
                }
            });
        });
    }
    //获得群成员信息
    get_group_list(groupid, fn){
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection("groupchat").findOne({groupid:groupid}, (err, res) => {
                this.assert.equal(err, null);
                fn(res.members);
                cli.close();
            });
        });
    }
    //退出群聊
    exit_group(username, groupid, fn){
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            //删除groupchat的members中的username
            cli.db().collection('groupchat').findOne({groupid: groupid},(err, res) => {
                this.assert.equal(err, null);
                if (res!==null){
                    var group_members=res.members;
                    var index=group_members.indexOf(username);
                    group_members.splice(index,1);
                    let del_ingroup = () => {
                        //删除user的ingroup中的groupid
                        cli.db().collection('user').findOne({username: username},(err, res) => {
                            this.assert.equal(err, null);
                            if (res!==null){
                                var user_groups=res.ingroup;
                                var index=user_groups.indexOf(groupid);
                                user_groups.splice(index,1);
                                cli.db().collection('user').updateOne({username: username},{$set:{ingroup:user_groups}},(err, res) => {
                                    this.assert.equal(err, null);
                                    cli.close();
                                });
                            }
                        });
                        var res={
                            status:true,
                            delGroupId:groupid
                        }
                        fn(res);
                    };
                    if (group_members.length===0){
                        cli.db().collection('groupchat').deleteOne({groupid: groupid}, (err, res) => {
                            this.assert.equal(err, null);
                            del_ingroup();
                        });
                    }
                    else {
                        cli.db().collection('groupchat').updateOne({groupid: groupid},{$set:{members:group_members}},(err, res) => {
                            this.assert.equal(err, null);
                            del_ingroup();
                        });
                    }
                }

            });
        });
    }

    rename_group(old, name) {
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection('groupchat').update({groupid: old}, {$set:{groupname:name}},
                (err, res) => {
                    this.assert.equal(err, null);
                    cli.close();
                });
        });
    }

    kick_group(id, name) {
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection('groupchat').update({groupid: id}, {$pull:{members:name}},
                (err, res) => {
                    this.assert.equal(err, null);
                    cli.close();
                });
            cli.db().collection('user').update({username: name}, {$pull:{ingroup:id}},
                (err, res) => {
                    this.assert.equal(err, null);
                    cli.close();
                });
        });
    }

    add_group(id, name) {
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection('groupchat').update({groupid: id}, {$push:{members:name}},
                (err, res) => {
                    this.assert.equal(err, null);
                    cli.close();
                });
            cli.db().collection('user').update({username: name}, {$push:{ingroup:id}},
                (err, res) => {
                    this.assert.equal(err, null);
                    cli.close();
                });
        });
    }

    get_id_by_username(username, fn) {
        this.mongo_client.connect(this.db_url, (err, cli) => {
            this.assert.equal(err, null);
            cli.db().collection('user').findOne({username: username}, (err, res) => {
                this.assert.equal(err, null);
                console.log("get_id_by_username ");
                console.log(username);
                console.log(res);
                fn(res._id);
            });
        });
    }
}
