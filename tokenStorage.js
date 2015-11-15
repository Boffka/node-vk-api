/**
* Default storage a token
**/

var fs = require('fs');

function TokenStorage(storageFilePath) {
	this.storagePathFile = storageFilePath || process.cwd() +'/.vk-token.txt';

	this._checkFile = function (filepath, callback) {
		fs.access(filepath, fs.F_OK, function (err) {
			if (err) {
				callback(err);
			} else {
				fs.writeFile(filepath, '', function (err) {
					callback(err);
				});
			}
		});
	};
}

TokenStorage.prototype.setFilePath = function (storageFilePath) {
	this.storagePath = storagePathFile;
};

TokenStorage.prototype.getToken = function (callback) {
	var self = this;

	this._checkFile(this.storagePathFile, function (err) {
		if (err) {
			callback(err);
		} else {
			fs.readFile(self.storagePathFile, function (err, token) {
				callback(err, token.toString());
			});
		}
	})
};

TokenStorage.prototype.setToken = function (token, callback) {
	var self = this;

	this.getToken(function (err, tokenStorage) {
		if (err) {
			callback(err);
		} else {
			if (tokenStorage !== token) {
				fs.writeFile(self.storagePathFile, token, function (err) {

					if (callback) callback(err);
				});
			}
		}
	});
};

module.exports = TokenStorage;