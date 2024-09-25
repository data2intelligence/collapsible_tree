setwd("/Users/_alanglanglang/Desktop/PhD-Lab/Cell.lineage.pilot")
getwd()

load(file = "data/raw.data/E-MTAB-6149_NSCLC_TPM.rda")

# test1000gene = sc.matrix.data[0:1000,]
# write.csv(test1000gene,file = "data/csv.data/test1000gene.csv")

over_gene6 = sc.matrix.data[c("CD8A","FIBP","NOC2L","ISG15","AURKAIP1","MRPL20"),]
write.csv(over_gene6,file = "data/csv.data/over_gene6.csv")