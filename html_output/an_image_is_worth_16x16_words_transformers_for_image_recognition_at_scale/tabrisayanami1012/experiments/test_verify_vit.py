import unittest
import numpy as np
from verify_vit import patchify, unpatchify, softmax, make_encoder, encode, paired_images, fit_linear_head


class StructureTests(unittest.TestCase):
    def test_patch_round_trip(self):
        x=np.arange(2*8*12*3).reshape(2,8,12,3)
        p=patchify(x,4)
        self.assertEqual(p.shape,(2,6,48))
        np.testing.assert_array_equal(unpatchify(p,8,12,4,3),x)

    def test_invalid_grid_rejected(self):
        with self.assertRaises(ValueError): patchify(np.zeros((1,7,8,3)),4)

    def test_softmax_shift_invariant_and_finite(self):
        x=np.array([[1000.,1001.,999.],[-1000.,-1000.,-999.]])
        a=softmax(x)
        np.testing.assert_allclose(a.sum(-1),[1,1])
        np.testing.assert_allclose(a,softmax(x+5000))
        self.assertTrue(np.all(np.isfinite(a)))

    def test_cls_invariance_and_patch_equivariance(self):
        x=np.random.default_rng(3).normal(size=(2,4,48))
        p=[2,0,3,1]
        for seed in range(5):
            model=make_encoder(seed)
            a,_=encode(x,model,False)
            b,_=encode(x[:,p],model,False)
            np.testing.assert_allclose(a[:,0],b[:,0],rtol=0,atol=1e-12)
            np.testing.assert_allclose(a[:,1:][:,p],b[:,1:],rtol=0,atol=1e-12)

    def test_paired_data_content_preserved(self):
        x,y=paired_images(13001,5)
        patches=patchify(x,4)
        np.testing.assert_array_equal(patches[0::2][:,[1,0,2,3]],patches[1::2])
        np.testing.assert_array_equal(y[0::2],np.ones(5))
        np.testing.assert_array_equal(y[1::2],np.zeros(5))

    def test_dataset_reproducibility_and_split(self):
        a,ay=paired_images(13001,2)
        b,by=paired_images(13001,2)
        c,_=paired_images(24002,2)
        np.testing.assert_array_equal(a,b)
        np.testing.assert_array_equal(ay,by)
        self.assertFalse(np.array_equal(a,c))

    def test_balanced_identical_features_cannot_separate(self):
        f=np.repeat(np.random.default_rng(4).normal(size=(16,24)),2,axis=0)
        y=np.tile([1.,0.],16)
        record=fit_linear_head(f,y,f,y)
        self.assertEqual(record['test_accuracy'],.5)
        self.assertAlmostEqual(record['loss_history'][-1]['loss'],np.log(2))

    def test_resolution_bookkeeping(self):
        self.assertEqual((224//16)**2+1,197)
        self.assertEqual((384//16)**2+1,577)
        self.assertEqual(577**2,332929)
        self.assertEqual((518//14)**2+1,1370)


if __name__=='__main__': unittest.main(verbosity=2)
