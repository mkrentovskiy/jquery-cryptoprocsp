(function($) {	
	var CURRENT_USER_STORE = 2;
	var MY_STORE = "My";
	var STORE_OPEN_MAXIMUM_ALLOWED = 2;
	
	var AUTHENTICATED_ATTRIBUTE_SIGNING_TIME = 0;
	
	var defaults = {
		user_store: CURRENT_USER_STORE,
		my_store: MY_STORE,
		max_allow: STORE_OPEN_MAXIMUM_ALLOWED,
		tsp_server: "http://cryptopro.ru/tsp/",
		attributes: [
			{name: AUTHENTICATED_ATTRIBUTE_SIGNING_TIME, value: function(opts) {
				return cdate(new Date());
			}}
		]
	}

	$.csp = function(pass) {		
		return $.isFunction(pass) ? pass(enabled()) : enabled();
	}

	$.csp.crt_find_types = { sha1: 0, subj: 1}
	$.csp.sign_types = { bes: 1, long_type_1: 0x5d }	

	$.csp.certificates = function() {	
		var r = [];
		var store = create("CAPICOM.Store");

		store.Open();
		var cnt = store.Certificates.Count;
		for(i = 1; i <= cnt; i++) {
			c = store.Certificates.Item(i);
			r.push({sha1: c.Thumbprint, subj: c.SubjectName});
		}
		store.Close();

		return r;
	}

	$.csp.sign = function(crt, msg, opts, error, crt_find_type, sign_type) {
		var s = $.extend({}, defaults, opts);
		var smsg = null;
		var cert = null;

		try {
			var store = create("CAPICOM.Store");
			store.Open(s.user_store, s.my_store, s.max_allow);

			var certs = store.Certificates.Find(crt_find_type ? crt_find_type : $.csp.crt_find_types.sha1, crt);

			if(certs && certs.Count > 0) cert = certs.Item(1);
			else throw "No certificates found";
	
			var signer = create("CAdESCOM.CPSigner");
			signer.Certificate = cert;
			signer.TSAAddress = s.tsp_server;

			$.each(s.attributes, function(i, p) {
				var item = create("CADESCOM.CPAttribute");
				item.Name = p.name;
				item.Value = $.isFunction(p.value) ? p.value(s) : p.value;
				signer.AuthenticatedAttributes2.Add(item);
			});

			var sd = create("CAdESCOM.CadesSignedData");
			sd.Content = msg;
			smsg = sd.SignCades(signer, sign_type ? sign_type : $.csp.sign_types.long_type_1);
		} catch (e) {
			smsg = null;
			er(e, error);
		} finally {
			store.Close();			
		}

		return smsg;
	}

	$.csp.verify = function(msg, error, sign_type) {
		var sdata = create("CAdESCOM.CadesSignedData");
		var r = true;
		try {
			sdata.VerifyCades(msg, sign_type ? sign_type : $.csp.sign_types.long_type_1);
		} catch (e) {
			er(e, error);
			r = false;
		}
		return r;
	}

	function enabled() {
		var r = false;

		if($.browser.msie) {
			try {
				var obj = new ActiveXObject("CAdESCOM.CPSigner");
				r = true;
			} catch (e) {};
		} else {
			var mt = navigator.mimeTypes["application/x-cades"];
			if(mt) {
				if(mt.enabledPlugin) {
					$("body").append("<object id='__cadesplugin' type='application/x-cades' style='visibility: hidden; width: 0px; height: 0px; margin: 0px; padding: 0px; border-style: none; border-width: 0px; max-width: 0px; max-height: 0px;'></object>");                    
					r = true;
				}
			}
		}
		
		return r;
	}
	function create(name) { return $.browser.msie ? new ActiveXObject(name) : $("#__cadesplugin").CreateObject(name); }
	function cdate(d) { return $.browser.msie ? d.getVarDate() : d; }
	function er(e, error) {
		var err = e.message ? ( e.number ? e.message : e.message + " (" + e.number + ")") : e; 
		if($.isFunction(error)) error(err, e);
		else alert(err);
	}

})(jQuery);