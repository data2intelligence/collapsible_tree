

# load(file = "data/raw.data/E-MTAB-6149_NSCLC_meta.rda")
# write.csv(sc.matrix.anno,file = "data/csv.data/E-MTAB-6149_NSCLC_meta.csv")

setwd("/Users/_alanglanglang/Desktop/PhD-Lab/Cell.lineage.pilot")
getwd()

load(file = "data/raw.data/E-MTAB-6149_NSCLC_TPM.rda")

# test1000gene = sc.matrix.data[0:1000,]
# write.csv(test1000gene,file = "data/csv.data/test1000gene.csv")

over_gene6 = sc.matrix.data[c("CD8A","FIBP","NOC2L","ISG15","AURKAIP1","MRPL20"),]
write.csv(over_gene6,file = "data/csv.data/over_gene6.csv")

# m = sc.matrix.data[1:10,1:5]
# 
# # mini df for test
# test3gene = sc.matrix.data[c("SAMD11", "NOC2L","CD8A"),]
# write.csv(test3gene,file = "data/csv.data/test3gene.csv")



# load data
load(file = "data/sce_raw_count_matrix/E-MTAB-6149_NSCLC_counts.rda")

col_name = colnames(counts)
col_name[duplicated(col_name)]

view_data = counts[1:10, 1:5]

# load meta data
meta.data = read.csv("data/csv.data/E-MTAB-6149_NSCLC_meta.csv")
batch_set = unique(meta.data$batch) # 20 in total
patient_set = unique(meta.data$Patient) # 5 in total

for (batch in batch_set){
  for (patient in patient_set){
    grouped_count = 
    }
}

write.csv(counts, file = "data/csv.data/E-MTAB-6149_NSCLC_raw_count.csv")
