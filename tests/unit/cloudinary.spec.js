const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const cloudinary = require('cloudinary').v2
require('dotenv').config();

describe("Testing cloudinary", () =>{
    let cloudinaryFile;

    beforeEach(() => {
        cloudinaryFile = rewire("../../routes/cloudinary.js");
    });

    afterEach(() => {
        sandbox.restore();
    })

    describe("Testing uploadImage()", () => {
        let uploadImage;
        let uploadStub;
        const fileSource = "https://lh3.googleusercontent.com/a/AGNmyxbjdCdenNt_rsh6wKGKFqHIsnmWR3qrc4oFecg8kw=s96-c";
        const folder = "profilePictures";
        const publicID = "User#2222";
        const uploadOptions = {
            upload_preset: process.env.CLOUDINARY_PRESET,
            public_id: publicID,
            folder: folder,
            unique_filename: true,
            resource_type: 'image',
            overwrite: true,
            invalidate: true
        };
        beforeEach(() => {
            uploadImage = cloudinaryFile.__get__("uploadImage");
            uploadStub = sandbox.stub(cloudinary.uploader, 'upload');
        });

        it("upload() is called", async function() {
            await uploadImage(fileSource, folder, publicID);
            expect(uploadStub).to.have.been.calledWith(fileSource, uploadOptions);
        });

        it("rejects when upload() rejects", async function() {
            let uploadImageSpy = sandbox.spy(uploadImage);
            uploadStub.rejects();

            try {
                await uploadImage(fileSource, folder, publicID);
            } catch {
            }

            expect(uploadStub).to.have.been.calledWith(fileSource, uploadOptions);
            expect(uploadImageSpy).to.have.thrown;

        });
    });

    describe("Testing deleteImage()", () => {
        let deleteImage;
        let destroyStub;
        const publicID = "User#2222";
        const deleteOptions = {
            resource_type: 'image',
            type: 'upload',
            invalidate: false
        };
        beforeEach(() => {
            deleteImage = cloudinaryFile.__get__('deleteImage');
            destroyStub = sandbox.stub(cloudinary.uploader, 'destroy');
        });

        it("destroy() is called", async function() {
            await deleteImage(publicID);
            expect(destroyStub).to.have.been.calledWith(publicID, deleteOptions);
        });

        it("rejects when destroy() rejects", async function() {
            let deleteImageSpy = sandbox.spy(deleteImage);
            destroyStub.rejects();
            try {
                await deleteImage(publicID);
            } catch {
            }
            expect(deleteImageSpy).to.have.thrown;
            expect(destroyStub).to.have.been.calledWith(publicID, deleteOptions);
        });
    });
});