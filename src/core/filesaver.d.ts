declare module "filesaver.js-npm"{
    // this ambient type declaration is necessary so we can use the filesaver module
    function saveAs(data:Blob,filename:string,disableAutoBOM:boolean):void
}
