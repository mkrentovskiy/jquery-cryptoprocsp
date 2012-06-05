(function($) {	
	var CURRENT_USER_STORE = 2;
	var MY_STORE = "My";
	var STORE_OPEN_MAXIMUM_ALLOWED = 2;
	var CERTIFICATE_FIND_SUBJECT_NAME = 1;
	var AUTHENTICATED_ATTRIBUTE_SIGNING_TIME = 0;
	
	var AUTHENTICATED_ATTRIBUTE_DOCUMENT_NAME = 1;
	var CADES_BES = 1;

  	$.csp = function(opts) {
  		$("body").append("<object id='__cadesplugin' type='application/x-cades' style='visibility: hidden; width: 0px; height: 0px; margin: 0px; padding: 0px; border-style: none; border-width: 0px; max-width: 0px; max-height: 0px;'></object>");
	}

	
	$.csp.sign = function(subj, msg, opts) {
		var store = create("CAPICOM.Store");
    	store.Open(CURRENT_USER_STORE, MY_STORE, STORE_OPEN_MAXIMUM_ALLOWED);

    	var certs = store.Certificates.Find(CERTIFICATE_FIND_SUBJECT_NAME, subj);
    	if(certs.Count == 0) return Null;
    	var cert = certs.Item(1);
    
    	var timeat = create("CADESCOM.CPAttribute");
    	timeat.Name = AUTHENTICATED_ATTRIBUTE_SIGNING_TIME;
    	timeat.Value = cdate(new Date());
    
   		var signer = create("CAdESCOM.CPSigner");
    	signer.Certificate = cert;
    	signer.AuthenticatedAttributes2.Add(timeat);
    
    	var sd = create("CAdESCOM.CadesSignedData");
    	sd.Content = msg;
    	try {
        	var smsg = sd.SignCades(signer, CADES_BES);
    	} catch (e) {
    		opts.error(e);
        	return Null;
    	}
    	store.Close();
    	return smsg;
	}

	$.csp.verify = function(msg) {

	}

	function create(name) { return $.browser.msie ? new ActiveXObject(name) : $("#__cadesplugin").CreateObject(name); }
	function cdate(d) { return $.browser.msie ? d.getVarDate() : d; }
}}

})(jQuery);
$(document).ready(function() { $.csp(); });